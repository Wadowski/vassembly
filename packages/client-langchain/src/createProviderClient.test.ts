import { vi, describe, it, expect, beforeEach } from "vitest";
import { WrongParamError } from "@vassembly/errors";

import { createProviderClient } from "./createProviderClient";
import { createChatGptProvider } from "./providers/createChatGptProvider";
import { createGeminiProvider } from "./providers/createGeminiProvider";
import { createLmStudioProvider } from "./providers/createLmStudioProvider";

vi.mock("@vassembly/domain-ai-integration/src/constants", () => ({
  AiIntegrationProvider: {
    Gemini: "gemini",
    ChatGpt: "chatgpt",
    LmStudio: "lm_studio",
  },
}));
vi.mock("./providers/createChatGptProvider");
vi.mock("./providers/createGeminiProvider");
vi.mock("./providers/createLmStudioProvider");

const PROVIDERS = {
  Gemini: "gemini",
  ChatGpt: "chatgpt",
  LmStudio: "lm_studio",
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
});
