import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { WrongParamError } from "@vassembly/errors";

import { getModels } from "../operations/getModels";
import { invokeWithChatModel } from "../operations/invokeWithChatModel";
import { testConnection } from "../operations/testConnection";
import { listGeminiModels } from "../modelListing/listGeminiModels";
import type { AiProviderClient, GeminiProviderParams } from "../types";

const GEMINI_GET_MODELS_ERROR = "Failed to fetch Gemini models";
const GEMINI_INVOKE_ERROR = "Failed to invoke Gemini model";
const GEMINI_EMPTY_MODELS_ERROR = "No generative models available";

export const createGeminiProvider = (
  params: GeminiProviderParams,
): AiProviderClient => {
  if (!params.apiKey) {
    throw new WrongParamError("API key is required for Gemini provider");
  }

  const listModelsParams = { apiKey: params.apiKey };
  const listModels = (): Promise<string[]> => listGeminiModels(listModelsParams);

  const createChatModel = (model: string) =>
    new ChatGoogleGenerativeAI({
      model,
      apiKey: params.apiKey,
    });

  return {
    testConnection: () =>
      testConnection({
        listModels,
        emptyModelsError: GEMINI_EMPTY_MODELS_ERROR,
      }),
    getModels: () =>
      getModels({ listModels, errorMessage: GEMINI_GET_MODELS_ERROR }),
    invoke: (invokeParams) =>
      invokeWithChatModel({
        createChatModel,
        invokeParams,
        errorMessage: GEMINI_INVOKE_ERROR,
      }),
  };
};
