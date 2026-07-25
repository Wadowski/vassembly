import { ToolMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { DynamicStructuredTool } from '@langchain/core/tools';

import { assertNotAborted } from '../utils/assertNotAborted';
import { invokeModelWithSignal } from '../utils/invokeModelWithSignal';
import {
  extractTokenUsageFromMessage,
  mergeTokenUsage,
} from '../utils/extractTokenUsageFromMessage';
import type { RecordMcpToolCall } from '../mcp/recordMcpToolCall';
import type { AiProviderInvokeResult } from '../types';

export interface RunToolCallLoopParams {
  model: BaseChatModel;
  tools: DynamicStructuredTool[];
  messages: BaseMessage[];
  maxIterations: number;
  signal?: AbortSignal;
  shouldAbort?: () => Promise<boolean>;
  toolNameToServerName?: Map<string, string>;
  recordMcpToolCall?: RecordMcpToolCall;
}

export interface RunToolCallLoopResult {
  response: BaseMessage;
  executedToolNames: string[];
  usage?: NonNullable<AiProviderInvokeResult['usage']>;
}

const getToolCalls = (
  response: BaseMessage,
): Array<{ name: string; args: Record<string, unknown>; id?: string }> => {
  if (!('tool_calls' in response)) {
    return [];
  }

  const toolCalls = response.tool_calls;

  if (!Array.isArray(toolCalls)) {
    return [];
  }

  return toolCalls;
};

const serializeToolContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }

  return JSON.stringify(content);
};

const CONSOLE_LOG_PREFIX = 'client-langchain ::';

const logRecordingFailure = (error: unknown): void => {
  console.error(`${CONSOLE_LOG_PREFIX} MCP usage recording failed`, error);
};

const invokeToolWithRecording = async ({
  tool,
  toolCall,
  toolNameToServerName,
  recordMcpToolCall,
}: {
  tool: DynamicStructuredTool;
  toolCall: { name: string; args: Record<string, unknown>; id?: string };
  toolNameToServerName?: Map<string, string>;
  recordMcpToolCall?: RecordMcpToolCall;
}): Promise<unknown> => {
  const mcpId = toolNameToServerName?.get(toolCall.name);
  const startedAt = new Date();
  let eventId: string | undefined;

  if (mcpId && recordMcpToolCall) {
    try {
      const result = await recordMcpToolCall({
        phase: 'started',
        mcpId,
        toolName: toolCall.name,
        args: toolCall.args,
        startedAt,
      });

      if (typeof result === 'string') {
        eventId = result;
      }
    } catch (error: unknown) {
      logRecordingFailure(error);
    }
  }

  try {
    const toolContent = await tool.invoke(toolCall.args);

    if (mcpId && recordMcpToolCall && eventId) {
      const endedAt = new Date();

      try {
        await recordMcpToolCall({
          phase: 'completed',
          eventId,
          status: 'success',
          endedAt,
          durationMs: endedAt.getTime() - startedAt.getTime(),
        });
      } catch (error: unknown) {
        logRecordingFailure(error);
      }
    }

    return toolContent;
  } catch (error: unknown) {
    if (mcpId && recordMcpToolCall && eventId) {
      const endedAt = new Date();
      const errorMessage = error instanceof Error ? error.message : String(error);

      try {
        await recordMcpToolCall({
          phase: 'completed',
          eventId,
          status: 'error',
          endedAt,
          durationMs: endedAt.getTime() - startedAt.getTime(),
          errorMessage,
        });
      } catch (recordError: unknown) {
        logRecordingFailure(recordError);
      }
    }

    throw error;
  }
};

export const runToolCallLoop = async ({
  model,
  tools,
  messages,
  maxIterations,
  signal,
  shouldAbort,
  toolNameToServerName,
  recordMcpToolCall,
}: RunToolCallLoopParams): Promise<RunToolCallLoopResult> => {
  const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
  const modelWithTools =
    tools.length > 0 && typeof model.bindTools === 'function' ? model.bindTools(tools) : model;
  let currentMessages = messages;
  const executedToolNames: string[] = [];
  let usage: NonNullable<AiProviderInvokeResult['usage']> | undefined;

  const recordExecutedTool = (toolName: string): void => {
    if (!executedToolNames.includes(toolName)) {
      executedToolNames.push(toolName);
    }
  };

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    await assertNotAborted({ signal, shouldAbort });

    const response = await invokeModelWithSignal({
      model: modelWithTools,
      messages: currentMessages,
      signal,
    });
    usage = mergeTokenUsage(usage, extractTokenUsageFromMessage(response));
    const toolCalls = getToolCalls(response);

    if (toolCalls.length === 0) {
      return { response, executedToolNames, usage };
    }

    currentMessages = [...currentMessages, response];

    const toolMessages = await Promise.all(
      toolCalls.map(async (toolCall) => {
        await assertNotAborted({ signal, shouldAbort });

        const tool = toolsByName[toolCall.name];
        if (tool) {
          recordExecutedTool(toolCall.name);
          const toolContent = await invokeToolWithRecording({
            tool,
            toolCall,
            toolNameToServerName,
            recordMcpToolCall,
          });
          return new ToolMessage({
            content: serializeToolContent(toolContent),
            tool_call_id: toolCall.id ?? `${toolCall.name}-${iteration}`,
          });
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
  return { response, executedToolNames, usage };
};
