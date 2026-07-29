import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ExecutionPausedError, InternalError, UserInputWaitingError } from '@vassembly/errors';

import { buildInternalTools, mergeToolsWithInternalPrecedence } from '../internalTools';
import { mapExecutedLlmToolNamesToIds } from '../internalTools/mapExecutedLlmToolNamesToIds';
import { mapExecutedToolResultsToIds } from '../internalTools/mapExecutedToolResultsToIds';
import { MCP_TOOL_MAX_ITERATIONS, loadMcpTools } from '../mcp';
import { assertNotAborted } from '../utils/assertNotAborted';
import { extractTokenUsageFromMessage } from '../utils/extractTokenUsageFromMessage';
import { invokeModelWithSignal } from '../utils/invokeModelWithSignal';
import { stripModelReasoningBlocks } from '../utils/stripModelReasoningBlocks';
import { runToolCallLoop } from './runToolCallLoop';

import type { AiProviderInvokeParams, AiProviderInvokeResult } from '../types';

export interface InvokeWithChatModelParams {
  createChatModel: (model: string) => BaseChatModel;
  invokeParams: AiProviderInvokeParams;
  errorMessage: string;
}

const CONSOLE_LOG_PREFIX = 'client-langchain ::';

const extractMessageContent = (content: unknown): string => {
  const rawContent = typeof content === 'string' ? content : String(content);

  return stripModelReasoningBlocks(rawContent);
};

const buildInitialMessages = (invokeParams: AiProviderInvokeParams) => {
  const messages = [];

  if (invokeParams.systemMessage) {
    messages.push(new SystemMessage(invokeParams.systemMessage));
  }

  messages.push(new HumanMessage(invokeParams.message));

  return messages;
};

const buildHandlerMap = (
  internalToolBindings: NonNullable<AiProviderInvokeParams['internalToolBindings']>,
): Record<string, (args: Record<string, unknown>) => Promise<string>> =>
  Object.fromEntries(internalToolBindings.map((binding) => [binding.toolId, binding.handler]));

interface InvokeModelResult {
  message: string;
  usage?: AiProviderInvokeResult['usage'];
  toolUsage?: AiProviderInvokeResult['toolUsage'];
}

const invokeModel = async ({
  createChatModel,
  invokeParams,
}: {
  createChatModel: (model: string) => BaseChatModel;
  invokeParams: AiProviderInvokeParams;
}): Promise<InvokeModelResult> => {
  const chatModel = createChatModel(invokeParams.model);
  const messages = buildInitialMessages(invokeParams);
  const mcpServerConfigs = invokeParams.mcpServerConfigs ?? [];
  const internalToolBindings = invokeParams.internalToolBindings ?? [];
  const hasTools = mcpServerConfigs.length > 0 || internalToolBindings.length > 0;

  if (!hasTools) {
    await assertNotAborted({
      signal: invokeParams.signal,
      shouldAbort: invokeParams.shouldAbort,
    });

    const result = await invokeModelWithSignal({
      model: chatModel,
      messages,
      signal: invokeParams.signal,
    });

    return {
      message: extractMessageContent(result.content),
      usage: extractTokenUsageFromMessage(result),
    };
  }

  const {
    tools: internalTools,
    skippedToolIds,
    toolNameToInternalToolId,
  } = buildInternalTools({
    toolIds: internalToolBindings.map((binding) => binding.toolId),
    handlers: buildHandlerMap(internalToolBindings),
  });

  let mcpTools: Awaited<ReturnType<typeof loadMcpTools>>['tools'] = [];
  let toolNameToServerName: Map<string, string> | undefined;
  let toolNameToOriginalName: Map<string, string> | undefined;
  let close: () => Promise<void> = async () => undefined;

  if (mcpServerConfigs.length > 0) {
    const loadedMcpTools = await loadMcpTools({ serverConfigs: mcpServerConfigs });
    mcpTools = loadedMcpTools.tools;
    toolNameToServerName = loadedMcpTools.toolNameToServerName;
    toolNameToOriginalName = loadedMcpTools.toolNameToOriginalName;
    close = loadedMcpTools.close;
  }

  const { tools: mergedTools, skippedMcpToolNames } = mergeToolsWithInternalPrecedence({
    internalTools,
    mcpTools,
  });

  if (skippedMcpToolNames.length > 0) {
    console.warn(
      `${CONSOLE_LOG_PREFIX} skipped MCP tools due to internal tool name collision`,
      skippedMcpToolNames,
    );
  }

  try {
    const { response, executedToolNames, executedToolResults, usage } = await runToolCallLoop({
      model: chatModel,
      tools: mergedTools,
      messages,
      maxIterations: MCP_TOOL_MAX_ITERATIONS,
      signal: invokeParams.signal,
      shouldAbort: invokeParams.shouldAbort,
      toolNameToServerName,
      toolNameToOriginalName,
      toolNameToInternalToolId,
      recordMcpToolCall: invokeParams.recordMcpToolCall,
      recordInternalToolCall: invokeParams.recordInternalToolCall,
      requireSuccessfulToolLlmName: invokeParams.requireSuccessfulToolLlmName,
    });

    return {
      message: extractMessageContent(response.content),
      usage,
      toolUsage: {
        internalToolIdsUsed: mapExecutedLlmToolNamesToIds(executedToolNames),
        internalToolResults: mapExecutedToolResultsToIds(executedToolResults),
        skippedInternalToolIds: skippedToolIds,
        skippedMcpToolNames: skippedMcpToolNames.length > 0 ? skippedMcpToolNames : undefined,
      },
    };
  } finally {
    await close();
  }
};

export const invokeWithChatModel = async ({
  createChatModel,
  invokeParams,
  errorMessage,
}: InvokeWithChatModelParams): Promise<AiProviderInvokeResult> => {
  try {
    const { message, usage, toolUsage } = await invokeModel({ createChatModel, invokeParams });

    return {
      message,
      model: invokeParams.model,
      usage,
      toolUsage,
    };
  } catch (error: unknown) {
    if (error instanceof ExecutionPausedError) {
      throw error;
    }

    if (error instanceof UserInputWaitingError) {
      throw error;
    }

    console.error(`${CONSOLE_LOG_PREFIX} invoke failed`, error);
    throw new InternalError(errorMessage, error);
  }
};
