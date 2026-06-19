import { vi, describe, it, expect, beforeEach } from "vitest";
import { WrongParamError } from "@vassembly/errors";

import { createProviderClient } from "./createProviderClient";
import { createChatGptProvider } from "./providers/createChatGptProvider";
import { createDeepSeekProvider } from "./providers/createDeepSeekProvider";
import { createAnthropicProvider } from "./providers/createAnthropicProvider";
import { createGeminiProvider } from "./providers/createGeminiProvider";
import { createLmStudioProvider } from "./providers/createLmStudioProvider";

vi.mock("@vassembly/domain-ai-integration/src/constants", () => ({
  AiIntegrationProvider: {
    Gemini: "gemini",
    ChatGpt: "chatgpt",
    LmStudio: "lm_studio",
    DeepSeek: "deep_seek",
    Anthropic: "anthropic",
  },
}));
vi.mock("./providers/createChatGptProvider");
vi.mock("./providers/createDeepSeekProvider");
vi.mock("./providers/createAnthropicProvider");
vi.mock("./providers/createGeminiProvider");
vi.mock("./providers/createLmStudioProvider");

const PROVIDERS = {
  Gemini: "gemini",
  ChatGpt: "chatgpt",
  LmStudio: "lm_studio",
  DeepSeek: "deep_seek",
  Anthropic: "anthropic",
} as const;

const mockClient = () => ({
  testConnection: vi.fn(),
  getModels: vi.fn(),
  invoke: vi.fn(),
});

describe("createProviderClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createChatGptProvider).mockReturnValue(mockClient());
    vi.mocked(createDeepSeekProvider).mockReturnValue(mockClient());
    vi.mocked(createAnthropicProvider).mockReturnValue(mockClient());
    vi.mocked(createGeminiProvider).mockReturnValue(mockClient());
    vi.mocked(createLmStudioProvider).mockReturnValue(mockClient());
  });

  it("should create ChatGPT provider when provider is chatgpt", () => {
    createProviderClient({ provider: PROVIDERS.ChatGpt, apiKey: "sk-test" });
    expect(createChatGptProvider).toHaveBeenCalledWith({
      apiKey: "sk-test",
      organizationId: undefined,
    });
  });

  it("should create Gemini provider when provider is gemini", () => {
    createProviderClient({ provider: PROVIDERS.Gemini, apiKey: "gemini-key" });
    expect(createGeminiProvider).toHaveBeenCalledWith({ apiKey: "gemini-key" });
  });

  it("should create LM Studio provider when provider is lm_studio", () => {
    createProviderClient({
      provider: PROVIDERS.LmStudio,
      baseUrl: "http://localhost:1234/v1",
    });
    expect(createLmStudioProvider).toHaveBeenCalledWith({
      baseUrl: "http://localhost:1234/v1",
      apiKey: undefined,
    });
  });

  it("should create Deep Seek provider when provider is deep_seek", () => {
    createProviderClient({ provider: PROVIDERS.DeepSeek, apiKey: "sk-deepseek" });
    expect(createDeepSeekProvider).toHaveBeenCalledWith({
      apiKey: "sk-deepseek",
      baseUrl: undefined,
    });
  });

  it("should create Anthropic provider when provider is anthropic", () => {
    createProviderClient({ provider: PROVIDERS.Anthropic, apiKey: "anthropic-key" });
    expect(createAnthropicProvider).toHaveBeenCalledWith({ apiKey: "anthropic-key" });
  });

  it("should throw WrongParamError for unknown provider", () => {
    expect(() => createProviderClient({ provider: "unknown", apiKey: "key" })).toThrow(
      WrongParamError,
    );
  });

  it("should throw WrongParamError when ChatGPT apiKey is missing", () => {
    expect(() => createProviderClient({ provider: PROVIDERS.ChatGpt })).toThrow(
      WrongParamError,
    );
  });

  it("should throw WrongParamError when Gemini apiKey is missing", () => {
    expect(() => createProviderClient({ provider: PROVIDERS.Gemini })).toThrow(
      WrongParamError,
    );
  });

  it("should throw WrongParamError when LM Studio baseUrl is missing", () => {
    expect(() => createProviderClient({ provider: PROVIDERS.LmStudio })).toThrow(
      WrongParamError,
    );
  });

  it("should throw WrongParamError when Deep Seek apiKey is missing", () => {
    expect(() => createProviderClient({ provider: PROVIDERS.DeepSeek })).toThrow(
      WrongParamError,
    );
  });

  it("should throw WrongParamError when Anthropic apiKey is missing", () => {
    expect(() => createProviderClient({ provider: PROVIDERS.Anthropic })).toThrow(
      WrongParamError,
    );
  });
});
