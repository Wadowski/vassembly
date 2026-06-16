import { ToolMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { ExecutionPausedError } from '@vassembly/errors';

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
}

export interface RunToolCallLoopResult {
  response: BaseMessage;
  executedToolNames: string[];
  usage?: NonNullable<AiProviderInvokeResult['usage']>;
}

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
    if (signal?.aborted) {
      throw new ExecutionPausedError();
    }

    const response = await modelWithTools.invoke(currentMessages);
    usage = mergeTokenUsage(usage, extractTokenUsageFromMessage(response));
    const toolCalls = response.tool_calls ?? [];

    if (toolCalls.length === 0) {
      return { response, executedToolNames, usage };
    }

    currentMessages = [...currentMessages, response];

    for (const toolCall of toolCalls) {
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

  const response = await modelWithTools.invoke(currentMessages);
  usage = mergeTokenUsage(usage, extractTokenUsageFromMessage(response));
  return { response, executedToolNames, usage };
};
