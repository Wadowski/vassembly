import { ChatOpenAI } from "@langchain/openai";
import { WrongParamError } from "@vassembly/errors";

import { getModels } from "../operations/getModels";
import { invokeWithChatModel } from "../operations/invokeWithChatModel";
import { testConnection } from "../operations/testConnection";
import { listOpenAiModels } from "../modelListing/listOpenAiModels";
import type { AiProviderClient, LmStudioProviderParams } from "../types";

const LM_STUDIO_GET_MODELS_ERROR = "Failed to fetch LM Studio models";
const LM_STUDIO_INVOKE_ERROR = "Failed to invoke LM Studio model";
const LM_STUDIO_EMPTY_MODELS_ERROR = "No models available in LM Studio";

export const createLmStudioProvider = (
  params: LmStudioProviderParams,
): AiProviderClient => {
  if (!params.baseUrl) {
    throw new WrongParamError("Base URL is required for LM Studio provider");
  }

  try {
    new URL(params.baseUrl);
  } catch {
    throw new WrongParamError(`Invalid base URL: ${params.baseUrl}`);
  }

  const apiKey = params.apiKey ?? "not-needed";
  const listModelsParams = {
    apiKey,
    baseUrl: params.baseUrl,
  };

  const listModels = (): Promise<string[]> => listOpenAiModels(listModelsParams);

  const createChatModel = (model: string) =>
    new ChatOpenAI({
      model,
      apiKey,
      configuration: {
        baseURL: params.baseUrl,
      },
    });

  return {
    testConnection: () =>
      testConnection({
        listModels,
        emptyModelsError: LM_STUDIO_EMPTY_MODELS_ERROR,
      }),
    getModels: () =>
      getModels({ listModels, errorMessage: LM_STUDIO_GET_MODELS_ERROR }),
    invoke: (invokeParams) =>
      invokeWithChatModel({
        createChatModel,
        invokeParams,
        errorMessage: LM_STUDIO_INVOKE_ERROR,
      }),
  };
};
