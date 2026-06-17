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
import type { AiProviderInvokeResult } from '../types';

export interface RunToolCallLoopParams {
  model: BaseChatModel;
  tools: DynamicStructuredTool[];
  messages: BaseMessage[];
  maxIterations: number;
  signal?: AbortSignal;
  shouldAbort?: () => Promise<boolean>;
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

export const runToolCallLoop = async ({
  model,
  tools,
  messages,
  maxIterations,
  signal,
  shouldAbort,
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

    for (const toolCall of toolCalls) {
      await assertNotAborted({ signal, shouldAbort });

      const tool = toolsByName[toolCall.name];
      if (tool) {
        recordExecutedTool(toolCall.name);
        const toolContent = await tool.invoke(toolCall.args);
        currentMessages.push(
          new ToolMessage({
            content: serializeToolContent(toolContent),
            tool_call_id: toolCall.id ?? `${toolCall.name}-${iteration}`,
          }),
        );
        continue;
      }

      currentMessages.push(
        new ToolMessage({
          content: `Tool ${toolCall.name} not found`,
          tool_call_id: toolCall.id ?? `${toolCall.name}-${iteration}`,
        }),
      );
    }
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
