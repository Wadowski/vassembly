import { HumanMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { InternalError } from "@vassembly/errors";

import type { AiProviderInvokeParams, AiProviderInvokeResult } from "../types";

export interface InvokeWithChatModelParams {
  createChatModel: (model: string) => BaseChatModel;
  invokeParams: AiProviderInvokeParams;
  errorMessage: string;
}

const CONSOLE_LOG_PREFIX = "client-langchain ::";

const extractMessageContent = (content: unknown): string => {
  if (typeof content === "string") {
    return content;
  }

  return String(content);
};

export const invokeWithChatModel = async ({
  createChatModel,
  invokeParams,
  errorMessage,
}: InvokeWithChatModelParams): Promise<AiProviderInvokeResult> => {
  try {
    const chatModel = createChatModel(invokeParams.model);
    const result = await chatModel.invoke([new HumanMessage(invokeParams.message)]);

    return {
      message: extractMessageContent(result.content),
      model: invokeParams.model,
    };
  } catch (error) {
    console.error(`${CONSOLE_LOG_PREFIX} invoke failed`, error);
    throw new InternalError(errorMessage, error);
  }
};
