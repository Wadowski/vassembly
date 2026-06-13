import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { InternalError } from '@vassembly/errors';

import { MCP_TOOL_MAX_ITERATIONS, loadMcpTools } from '../mcp';
import { runToolCallLoop } from './runToolCallLoop';

import type { AiProviderInvokeParams, AiProviderInvokeResult } from '../types';

export interface InvokeWithChatModelParams {
  createChatModel: (model: string) => BaseChatModel;
  invokeParams: AiProviderInvokeParams;
  errorMessage: string;
}

const CONSOLE_LOG_PREFIX = 'client-langchain ::';

const extractMessageContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }

  return String(content);
};

const buildInitialMessages = (invokeParams: AiProviderInvokeParams) => {
  const messages = [];

  if (invokeParams.systemMessage) {
    messages.push(new SystemMessage(invokeParams.systemMessage));
  }

  messages.push(new HumanMessage(invokeParams.message));

  return messages;
};

const invokeModel = async ({
  createChatModel,
  invokeParams,
}: {
  createChatModel: (model: string) => BaseChatModel;
  invokeParams: AiProviderInvokeParams;
}) => {
  const chatModel = createChatModel(invokeParams.model);
  const messages = buildInitialMessages(invokeParams);
  const mcpServerConfigs = invokeParams.mcpServerConfigs ?? [];

  if (mcpServerConfigs.length === 0) {
    const result = await chatModel.invoke(messages);
    return extractMessageContent(result.content);
  }

  const { tools, close } = await loadMcpTools({ serverConfigs: mcpServerConfigs });

  try {
    const response = await runToolCallLoop({
      model: chatModel,
      tools,
      messages,
      maxIterations: MCP_TOOL_MAX_ITERATIONS,
    });

    return extractMessageContent(response.content);
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
    const message = await invokeModel({ createChatModel, invokeParams });

    return {
      message,
      model: invokeParams.model,
    };
  } catch (error) {
    console.error(`${CONSOLE_LOG_PREFIX} invoke failed`, error);
    throw new InternalError(errorMessage, error);
  }
};
