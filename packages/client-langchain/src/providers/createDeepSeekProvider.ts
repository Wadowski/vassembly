import { ChatOpenAI } from "@langchain/openai";
import { WrongParamError } from "@vassembly/errors";

import { getModels } from "../operations/getModels";
import { invokeWithChatModel } from "../operations/invokeWithChatModel";
import { testConnection } from "../operations/testConnection";
import { listOpenAiModels } from "../modelListing/listOpenAiModels";
import type { AiProviderClient, DeepSeekProviderParams } from "../types";

const DEEP_SEEK_DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEEP_SEEK_GET_MODELS_ERROR = "Failed to fetch Deep Seek models";
const DEEP_SEEK_INVOKE_ERROR = "Failed to invoke Deep Seek model";
const DEEP_SEEK_EMPTY_MODELS_ERROR = "No models available from Deep Seek";

export const createDeepSeekProvider = (
  params: DeepSeekProviderParams,
): AiProviderClient => {
  if (!params.apiKey) {
    throw new WrongParamError("API key is required for Deep Seek provider");
  }

  const baseUrl = params.baseUrl?.trim() || DEEP_SEEK_DEFAULT_BASE_URL;

  try {
    new URL(baseUrl);
  } catch {
    throw new WrongParamError(`Invalid base URL: ${baseUrl}`);
  }

  const listModelsParams = {
    apiKey: params.apiKey,
    baseUrl,
  };

  const listModels = (): Promise<string[]> => listOpenAiModels(listModelsParams);

  const createChatModel = (model: string) =>
    new ChatOpenAI({
      model,
      apiKey: params.apiKey,
      configuration: {
        baseURL: baseUrl,
      },
    });

  return {
    testConnection: () =>
      testConnection({
        listModels,
        emptyModelsError: DEEP_SEEK_EMPTY_MODELS_ERROR,
      }),
    getModels: () =>
      getModels({ listModels, errorMessage: DEEP_SEEK_GET_MODELS_ERROR }),
    invoke: (invokeParams) =>
      invokeWithChatModel({
        createChatModel,
        invokeParams,
        errorMessage: DEEP_SEEK_INVOKE_ERROR,
      }),
  };
};
