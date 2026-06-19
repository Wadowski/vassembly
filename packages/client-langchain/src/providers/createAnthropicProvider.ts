import { ChatAnthropic } from "@langchain/anthropic";
import { WrongParamError } from "@vassembly/errors";

import { getModels } from "../operations/getModels";
import { invokeWithChatModel } from "../operations/invokeWithChatModel";
import { testConnection } from "../operations/testConnection";
import { listAnthropicModels } from "../modelListing/listAnthropicModels";
import type { AiProviderClient, AnthropicProviderParams } from "../types";

const ANTHROPIC_GET_MODELS_ERROR = "Failed to fetch Anthropic models";
const ANTHROPIC_INVOKE_ERROR = "Failed to invoke Anthropic model";
const ANTHROPIC_EMPTY_MODELS_ERROR = "No models available from Anthropic";

export const createAnthropicProvider = (
  params: AnthropicProviderParams,
): AiProviderClient => {
  if (!params.apiKey) {
    throw new WrongParamError("API key is required for Anthropic provider");
  }

  const listModelsParams = { apiKey: params.apiKey };
  const listModels = (): Promise<string[]> => listAnthropicModels(listModelsParams);

  const createChatModel = (model: string) =>
    new ChatAnthropic({
      model,
      apiKey: params.apiKey,
    });

  return {
    testConnection: () =>
      testConnection({
        listModels,
        emptyModelsError: ANTHROPIC_EMPTY_MODELS_ERROR,
      }),
    getModels: () =>
      getModels({ listModels, errorMessage: ANTHROPIC_GET_MODELS_ERROR }),
    invoke: (invokeParams) =>
      invokeWithChatModel({
        createChatModel,
        invokeParams,
        errorMessage: ANTHROPIC_INVOKE_ERROR,
      }),
  };
};
