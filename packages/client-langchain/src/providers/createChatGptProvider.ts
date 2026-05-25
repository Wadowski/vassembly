import { ChatOpenAI } from "@langchain/openai";
import { WrongParamError } from "@vassembly/errors";

import { getModels } from "../operations/getModels";
import { invokeWithChatModel } from "../operations/invokeWithChatModel";
import { testConnection } from "../operations/testConnection";
import { listOpenAiModels } from "../modelListing/listOpenAiModels";
import type { AiProviderClient, ChatGptProviderParams } from "../types";

const CHATGPT_GET_MODELS_ERROR = "Failed to fetch ChatGPT models";
const CHATGPT_INVOKE_ERROR = "Failed to invoke ChatGPT model";

export const createChatGptProvider = (
  params: ChatGptProviderParams,
): AiProviderClient => {
  if (!params.apiKey) {
    throw new WrongParamError("API key is required for ChatGPT provider");
  }

  const listModelsParams = {
    apiKey: params.apiKey,
    organizationId: params.organizationId,
  };

  const listModels = (): Promise<string[]> => listOpenAiModels(listModelsParams);

  const createChatModel = (model: string) =>
    new ChatOpenAI({
      model,
      apiKey: params.apiKey,
      ...(params.organizationId && { organization: params.organizationId }),
    });

  return {
    testConnection: () => testConnection({ listModels }),
    getModels: () =>
      getModels({ listModels, errorMessage: CHATGPT_GET_MODELS_ERROR }),
    invoke: (invokeParams) =>
      invokeWithChatModel({
        createChatModel,
        invokeParams,
        errorMessage: CHATGPT_INVOKE_ERROR,
      }),
  };
};
