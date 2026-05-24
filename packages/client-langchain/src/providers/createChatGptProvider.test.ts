import { vi, describe, it, expect, beforeEach } from "vitest";
import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";
import { InternalError, WrongParamError } from "@vassembly/errors";

import { createChatGptProvider } from "./createChatGptProvider";

vi.mock("@langchain/openai");
vi.mock("openai");

const mockOpenAiClient = (modelsList: ReturnType<typeof vi.fn>): void => {
  vi.mocked(OpenAI).mockImplementation(
    () => ({ models: { list: modelsList } }) as never,
  );
};

describe("createChatGptProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw WrongParamError when apiKey is missing", () => {
    expect(() => createChatGptProvider({ apiKey: "" })).toThrow(WrongParamError);
  });

  it("should test connection successfully", async () => {
    mockOpenAiClient(
      vi.fn().mockResolvedValue({
        data: [{ id: "gpt-4" }, { id: "gpt-3.5-turbo" }],
      }),
    );
    const result = await createChatGptProvider({ apiKey: "sk-test" }).testConnection();
    expect(result.success).toBe(true);
    expect(result.models).toContain("gpt-4");
  });

  it("should handle connection test failure", async () => {
    mockOpenAiClient(vi.fn().mockRejectedValue(new Error("Invalid API key")));
    const result = await createChatGptProvider({ apiKey: "invalid" }).testConnection();
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid API key");
  });

  it("should get models successfully", async () => {
    mockOpenAiClient(vi.fn().mockResolvedValue({ data: [{ id: "gpt-4" }] }));
    const models = await createChatGptProvider({ apiKey: "sk-test" }).getModels();
    expect(models).toContain("gpt-4");
  });

  it("should throw InternalError when getModels fails", async () => {
    mockOpenAiClient(vi.fn().mockRejectedValue(new Error("API error")));
    await expect(
      createChatGptProvider({ apiKey: "sk-test" }).getModels(),
    ).rejects.toThrow(InternalError);
  });

  it("should invoke model successfully", async () => {
    vi.mocked(ChatOpenAI).mockImplementation(
      () =>
        ({ invoke: vi.fn().mockResolvedValue({ content: "Hello response" }) }) as never,
    );
    const result = await createChatGptProvider({ apiKey: "sk-test" }).invoke({
      model: "gpt-4",
      message: "Hi",
    });
    expect(result.message).toBe("Hello response");
    expect(result.model).toBe("gpt-4");
  });

  it("should throw InternalError on invoke failure", async () => {
    vi.mocked(ChatOpenAI).mockImplementation(
      () => ({ invoke: vi.fn().mockRejectedValue(new Error("Invoke error")) }) as never,
    );
    await expect(
      createChatGptProvider({ apiKey: "sk-test" }).invoke({
        model: "gpt-4",
        message: "Hi",
      }),
    ).rejects.toThrow(InternalError);
  });
});
