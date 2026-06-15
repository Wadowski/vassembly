import { WrongParamError } from "@vassembly/errors";

import { createChatGptProvider } from "./providers/createChatGptProvider";
import { createDeepSeekProvider } from "./providers/createDeepSeekProvider";
import { createAnthropicProvider } from "./providers/createAnthropicProvider";
import { createGeminiProvider } from "./providers/createGeminiProvider";
import { createLmStudioProvider } from "./providers/createLmStudioProvider";
import type { AiProviderClient, CreateProviderClientParams } from "./types";

const PROVIDER_SLUGS = {
  Gemini: "gemini",
  ChatGpt: "chatgpt",
  LmStudio: "lm_studio",
  DeepSeek: "deep_seek",
  Anthropic: "anthropic",
} as const;

const createGeminiClient = (
  input: CreateProviderClientParams,
): AiProviderClient => {
  if (!input.apiKey) {
    throw new WrongParamError("API key is required for Gemini");
  }

  return createGeminiProvider({ apiKey: input.apiKey });
};

const createChatGptClient = (
  input: CreateProviderClientParams,
): AiProviderClient => {
  if (!input.apiKey) {
    throw new WrongParamError("API key is required for ChatGPT");
  }

  return createChatGptProvider({
    apiKey: input.apiKey,
    organizationId: input.organizationId ?? undefined,
  });
};

const createLmStudioClient = (
  input: CreateProviderClientParams,
): AiProviderClient => {
  if (!input.baseUrl) {
    throw new WrongParamError("Base URL is required for LM Studio");
  }

  return createLmStudioProvider({
    baseUrl: input.baseUrl,
    apiKey: input.apiKey ?? undefined,
  });
};

const createDeepSeekClient = (
  input: CreateProviderClientParams,
): AiProviderClient => {
  if (!input.apiKey) {
    throw new WrongParamError("API key is required for Deep Seek");
  }

  return createDeepSeekProvider({
    apiKey: input.apiKey,
    baseUrl: input.baseUrl ?? undefined,
  });
};

const createAnthropicClient = (
  input: CreateProviderClientParams,
): AiProviderClient => {
  if (!input.apiKey) {
    throw new WrongParamError("API key is required for Anthropic");
  }

  return createAnthropicProvider({ apiKey: input.apiKey });
};

const PROVIDER_CLIENT_CREATORS: Record<
  string,
  (input: CreateProviderClientParams) => AiProviderClient
> = {
  [PROVIDER_SLUGS.Gemini]: createGeminiClient,
  [PROVIDER_SLUGS.ChatGpt]: createChatGptClient,
  [PROVIDER_SLUGS.LmStudio]: createLmStudioClient,
  [PROVIDER_SLUGS.DeepSeek]: createDeepSeekClient,
  [PROVIDER_SLUGS.Anthropic]: createAnthropicClient,
};

export const createProviderClient = (
  input: CreateProviderClientParams,
): AiProviderClient => {
  const creator = PROVIDER_CLIENT_CREATORS[input.provider];

  if (!creator) {
    throw new WrongParamError(`Unknown provider: ${input.provider}`);
  }

  return creator(input);
};
