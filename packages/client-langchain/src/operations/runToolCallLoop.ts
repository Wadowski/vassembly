import { HumanMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { DynamicStructuredTool } from '@langchain/core/tools';

import { normalizeToolInput } from '../internalTools/normalization/normalizeToolInput';
import { normalizeMcpToolInput } from '../mcp/normalizeMcpToolInput';
import {
  buildRequiredToolNudgeMessage,
  hasRequiredToolSucceeded,
} from './requiredSuccessfulTool';

import { assertNotAborted } from '../utils/assertNotAborted';
import { invokeModelWithSignal } from '../utils/invokeModelWithSignal';
import {
  extractTokenUsageFromMessage,
  mergeTokenUsage,
} from '../utils/extractTokenUsageFromMessage';
import type { RecordInternalToolCall } from '../internalTools/recordInternalToolCall';
import type { RecordMcpToolCall } from '../mcp/recordMcpToolCall';
import type { AiProviderInvokeResult } from '../types';

export interface RunToolCallLoopParams {
  model: BaseChatModel;
  tools: DynamicStructuredTool[];
  bindingTools?: DynamicStructuredTool[];
  messages: BaseMessage[];
  maxIterations: number;
  signal?: AbortSignal;
  shouldAbort?: () => Promise<boolean>;
  toolNameToServerName?: Map<string, string>;
  toolNameToOriginalName?: Map<string, string>;
  toolNameToInternalToolId?: Map<string, string>;
  recordMcpToolCall?: RecordMcpToolCall;
  recordInternalToolCall?: RecordInternalToolCall;
  requireSuccessfulToolLlmName?: string;
}

export interface ExecutedToolResult {
  toolName: string;
  content: string;
}

export interface RunToolCallLoopResult {
  response: BaseMessage;
  executedToolNames: string[];
  executedToolResults: ExecutedToolResult[];
  usage?: NonNullable<AiProviderInvokeResult['usage']>;
}

const recoverInvalidToolCalls = ({
  response,
  toolNameToInternalToolId,
}: {
  response: BaseMessage;
  toolNameToInternalToolId?: Map<string, string>;
}): Array<{ name: string; args: Record<string, unknown>; id?: string }> => {
  if (!('invalid_tool_calls' in response) || !Array.isArray(response.invalid_tool_calls)) {
    return [];
  }

  return response.invalid_tool_calls
    .filter((call) => typeof call.args === 'string' && call.args.trim().length > 0)
    .flatMap((call) => {
      const toolId = toolNameToInternalToolId?.get(call.name);

      if (!toolId) {
        return [];
      }

      const result = normalizeToolInput<Record<string, unknown>>({
        toolId,
        raw: call.args,
      });

      if (!result.success) {
        return [
          {
            name: call.name,
            args: { __invalidToolCallArgs: call.args },
            id: call.id,
          },
        ];
      }

      return [
        {
          name: call.name,
          args: result.data,
          id: call.id,
        },
      ];
    });
};

const getToolCalls = (
  response: BaseMessage,
  toolNameToInternalToolId?: Map<string, string>,
): Array<{ name: string; args: Record<string, unknown>; id?: string }> => {
  const recoveredInvalidCalls = recoverInvalidToolCalls({ response, toolNameToInternalToolId });

  if (!('tool_calls' in response)) {
    return recoveredInvalidCalls;
  }

  const toolCalls = response.tool_calls;

  if (!Array.isArray(toolCalls)) {
    return recoveredInvalidCalls;
  }

  return [...toolCalls, ...recoveredInvalidCalls];
};

const serializeToolContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }

  return JSON.stringify(content);
};

const CONSOLE_LOG_PREFIX = 'client-langchain ::';

const logRecordingFailure = (error: unknown): void => {
  console.error(`${CONSOLE_LOG_PREFIX} tool usage recording failed`, error);
};

interface ToolRecordingContext {
  mcpId?: string;
  internalToolId?: string;
  startedAt: Date;
  eventId?: string;
  recordMcp?: RecordMcpToolCall;
  recordInternal?: RecordInternalToolCall;
}

const startToolRecording = async ({
  toolCall,
  toolNameToServerName,
  toolNameToOriginalName,
  toolNameToInternalToolId,
  recordMcpToolCall,
  recordInternalToolCall,
}: {
  toolCall: { name: string; args: Record<string, unknown> };
  toolNameToServerName?: Map<string, string>;
  toolNameToOriginalName?: Map<string, string>;
  toolNameToInternalToolId?: Map<string, string>;
  recordMcpToolCall?: RecordMcpToolCall;
  recordInternalToolCall?: RecordInternalToolCall;
}): Promise<ToolRecordingContext | undefined> => {
  const startedAt = new Date();
  const mcpId = toolNameToServerName?.get(toolCall.name);
  const internalToolId = toolNameToInternalToolId?.get(toolCall.name);

  if (mcpId && recordMcpToolCall) {
    try {
      const originalToolName =
        toolNameToOriginalName?.get(toolCall.name) ?? toolCall.name;

      const result = await recordMcpToolCall({
        phase: 'started',
        mcpId,
        toolName: toolCall.name,
        originalToolName,
        args: toolCall.args,
        startedAt,
      });

      return {
        mcpId,
        startedAt,
        eventId: typeof result === 'string' ? result : undefined,
        recordMcp: recordMcpToolCall,
      };
    } catch (error: unknown) {
      logRecordingFailure(error);
      return undefined;
    }
  }

  if (internalToolId && recordInternalToolCall) {
    try {
      const result = await recordInternalToolCall({
        phase: 'started',
        internalToolId,
        toolName: toolCall.name,
        args: toolCall.args,
        startedAt,
      });

      return {
        internalToolId,
        startedAt,
        eventId: typeof result === 'string' ? result : undefined,
        recordInternal: recordInternalToolCall,
      };
    } catch (error: unknown) {
      logRecordingFailure(error);
      return undefined;
    }
  }

  return undefined;
};

const completeToolRecording = async ({
  recording,
  status,
  errorMessage,
  output,
}: {
  recording: ToolRecordingContext | undefined;
  status: 'success' | 'error';
  errorMessage?: string;
  output?: string;
}): Promise<void> => {
  if (!recording?.eventId) {
    return;
  }

  const endedAt = new Date();
  const completedInput = {
    phase: 'completed' as const,
    eventId: recording.eventId,
    status,
    endedAt,
    durationMs: endedAt.getTime() - recording.startedAt.getTime(),
    ...(errorMessage ? { errorMessage } : {}),
    ...(output ? { output } : {}),
  };

  try {
    if (recording.mcpId && recording.recordMcp) {
      await recording.recordMcp(completedInput);
      return;
    }

    if (recording.internalToolId && recording.recordInternal) {
      await recording.recordInternal(completedInput);
    }
  } catch (error: unknown) {
    logRecordingFailure(error);
  }
};

const buildMcpToolErrorPayload = ({
  toolName,
  serverName,
  errorMessage,
}: {
  toolName: string;
  serverName: string;
  errorMessage: string;
}): string => {
  return JSON.stringify({
    error: `MCP tool "${toolName}" (server: ${serverName}) rejected the arguments`,
    code: 'MCP_TOOL_ERROR',
    hint: `Original error: ${errorMessage}. Re-check the argument shape against the tool's schema and retry.`,
  });
};

const resolveToolInvokeArgs = ({
  toolCall,
  toolNameToServerName,
  toolNameToInternalToolId,
}: {
  toolCall: { name: string; args: Record<string, unknown> };
  toolNameToServerName?: Map<string, string>;
  toolNameToInternalToolId?: Map<string, string>;
}):
  | { kind: 'invoke'; args: Record<string, unknown> }
  | { kind: 'error'; content: string } => {
  const internalToolId = toolNameToInternalToolId?.get(toolCall.name);

  if (internalToolId) {
    const rawArgs =
      typeof toolCall.args.__invalidToolCallArgs === 'string'
        ? toolCall.args.__invalidToolCallArgs
        : toolCall.args;
    const normalized = normalizeToolInput<Record<string, unknown>>({
      toolId: internalToolId,
      raw: rawArgs,
    });

    if (!normalized.success) {
      return { kind: 'error', content: JSON.stringify(normalized.errorPayload) };
    }

    return { kind: 'invoke', args: normalized.data };
  }

  if (toolNameToServerName?.has(toolCall.name)) {
    const normalizedArgs = normalizeMcpToolInput({ raw: toolCall.args });

    if (typeof normalizedArgs === 'object' && normalizedArgs !== null && !Array.isArray(normalizedArgs)) {
      return { kind: 'invoke', args: normalizedArgs as Record<string, unknown> };
    }

    return { kind: 'invoke', args: toolCall.args };
  }

  return { kind: 'invoke', args: toolCall.args };
};

const invokeToolWithRecording = async ({
  tool,
  toolCall,
  toolNameToServerName,
  toolNameToOriginalName,
  toolNameToInternalToolId,
  recordMcpToolCall,
  recordInternalToolCall,
}: {
  tool: DynamicStructuredTool;
  toolCall: { name: string; args: Record<string, unknown>; id?: string };
  toolNameToServerName?: Map<string, string>;
  toolNameToOriginalName?: Map<string, string>;
  toolNameToInternalToolId?: Map<string, string>;
  recordMcpToolCall?: RecordMcpToolCall;
  recordInternalToolCall?: RecordInternalToolCall;
}): Promise<unknown> => {
  const recording = await startToolRecording({
    toolCall,
    toolNameToServerName,
    toolNameToOriginalName,
    toolNameToInternalToolId,
    recordMcpToolCall,
    recordInternalToolCall,
  });

  const resolvedArgs = resolveToolInvokeArgs({
    toolCall,
    toolNameToServerName,
    toolNameToInternalToolId,
  });

  if (resolvedArgs.kind === 'error') {
    await completeToolRecording({
      recording,
      status: 'error',
      errorMessage: resolvedArgs.content,
      output: resolvedArgs.content,
    });
    return resolvedArgs.content;
  }

  try {
    const toolContent = await tool.invoke(resolvedArgs.args);
    const serializedOutput = serializeToolContent(toolContent);
    await completeToolRecording({ recording, status: 'success', output: serializedOutput });
    return toolContent;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const mcpServerName = toolNameToServerName?.get(toolCall.name);

    if (mcpServerName) {
      const mcpErrorContent = buildMcpToolErrorPayload({
        toolName: toolCall.name,
        serverName: mcpServerName,
        errorMessage,
      });
      await completeToolRecording({
        recording,
        status: 'error',
        errorMessage,
        output: mcpErrorContent,
      });
      return mcpErrorContent;
    }

    await completeToolRecording({ recording, status: 'error', errorMessage });
    throw error;
  }
};

export const runToolCallLoop = async ({
  model,
  tools,
  bindingTools,
  messages,
  maxIterations,
  signal,
  shouldAbort,
  toolNameToServerName,
  toolNameToOriginalName,
  toolNameToInternalToolId,
  recordMcpToolCall,
  recordInternalToolCall,
  requireSuccessfulToolLlmName,
}: RunToolCallLoopParams): Promise<RunToolCallLoopResult> => {
  const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
  const toolsToBind = bindingTools ?? tools;
  const modelWithTools =
    toolsToBind.length > 0 && typeof model.bindTools === 'function'
      ? model.bindTools(toolsToBind)
      : model;
  let currentMessages = messages;
  const executedToolNames: string[] = [];
  const executedToolResults: ExecutedToolResult[] = [];
  let usage: NonNullable<AiProviderInvokeResult['usage']> | undefined;

  const recordExecutedTool = ({ toolName, content }: ExecutedToolResult): void => {
    if (!executedToolNames.includes(toolName)) {
      executedToolNames.push(toolName);
    }

    executedToolResults.push({ toolName, content });
  };

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    await assertNotAborted({ signal, shouldAbort });

    const response = await invokeModelWithSignal({
      model: modelWithTools,
      messages: currentMessages,
      signal,
    });
    usage = mergeTokenUsage(usage, extractTokenUsageFromMessage(response));
    const toolCalls = getToolCalls(response, toolNameToInternalToolId);

    if (toolCalls.length === 0) {
      const shouldNudgeForRequiredTool =
        requireSuccessfulToolLlmName !== undefined &&
        !hasRequiredToolSucceeded({
          requiredSuccessfulToolName: requireSuccessfulToolLlmName,
          executedToolResults,
        }) &&
        iteration < maxIterations - 1;

      if (shouldNudgeForRequiredTool) {
        currentMessages = [
          ...currentMessages,
          response,
          new HumanMessage(
            buildRequiredToolNudgeMessage({
              requiredSuccessfulToolName: requireSuccessfulToolLlmName,
              executedToolResults,
            }),
          ),
        ];
        continue;
      }

      return { response, executedToolNames, executedToolResults, usage };
    }

    currentMessages = [...currentMessages, response];

    const toolMessages = await Promise.all(
      toolCalls.map(async (toolCall) => {
        await assertNotAborted({ signal, shouldAbort });

        const tool = toolsByName[toolCall.name];
        if (tool) {
          try {
            const toolContent = await invokeToolWithRecording({
              tool,
              toolCall,
              toolNameToServerName,
              toolNameToOriginalName,
              toolNameToInternalToolId,
              recordMcpToolCall,
              recordInternalToolCall,
            });
            const serializedContent = serializeToolContent(toolContent);
            recordExecutedTool({ toolName: toolCall.name, content: serializedContent });
            return new ToolMessage({
              content: serializedContent,
              tool_call_id: toolCall.id ?? `${toolCall.name}-${iteration}`,
            });
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            recordExecutedTool({
              toolName: toolCall.name,
              content: JSON.stringify({ error: errorMessage }),
            });
            return new ToolMessage({
              content: errorMessage,
              tool_call_id: toolCall.id ?? `${toolCall.name}-${iteration}`,
            });
          }
        }

        return new ToolMessage({
          content: `Tool ${toolCall.name} not found`,
          tool_call_id: toolCall.id ?? `${toolCall.name}-${iteration}`,
        });
      }),
    );

    currentMessages.push(...toolMessages);
  }

  await assertNotAborted({ signal, shouldAbort });

  const response = await invokeModelWithSignal({
    model: modelWithTools,
    messages: currentMessages,
    signal,
  });
  usage = mergeTokenUsage(usage, extractTokenUsageFromMessage(response));
  return { response, executedToolNames, executedToolResults, usage };
};
