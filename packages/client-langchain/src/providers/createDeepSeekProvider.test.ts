import { vi, describe, it, expect, beforeEach } from "vitest";
import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";
import { InternalError, WrongParamError } from "@vassembly/errors";

import { createDeepSeekProvider } from "./createDeepSeekProvider";

vi.mock("@langchain/openai");
vi.mock("openai");

describe("createDeepSeekProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw WrongParamError when apiKey is missing", () => {
    expect(() => createDeepSeekProvider({ apiKey: "" })).toThrow(WrongParamError);
  });

  it("should throw WrongParamError for invalid baseUrl", () => {
    expect(() =>
      createDeepSeekProvider({ apiKey: "sk-test", baseUrl: "not-a-valid-url" }),
    ).toThrow(WrongParamError);
  });

  it("should test connection successfully with default base URL", async () => {
    vi.mocked(OpenAI).mockImplementation(
      () =>
        ({
          models: {
            list: vi.fn().mockResolvedValue({ data: [{ id: "deepseek-chat" }] }),
          },
        }) as never,
    );
    const result = await createDeepSeekProvider({ apiKey: "sk-test" }).testConnection();
    expect(result.success).toBe(true);
    expect(result.models).toContain("deepseek-chat");
  });

  it("should fail test connection when no models available", async () => {
    vi.mocked(OpenAI).mockImplementation(
      () => ({ models: { list: vi.fn().mockResolvedValue({ data: [] }) } }) as never,
    );
    const result = await createDeepSeekProvider({ apiKey: "sk-test" }).testConnection();
    expect(result.success).toBe(false);
    expect(result.error).toBe("No models available from Deep Seek");
  });

  it("should invoke model successfully", async () => {
    vi.mocked(ChatOpenAI).mockImplementation(
      () =>
        ({ invoke: vi.fn().mockResolvedValue({ content: "Deep Seek response" }) }) as never,
    );
    const result = await createDeepSeekProvider({ apiKey: "sk-test" }).invoke({
      model: "deepseek-chat",
      message: "Hello",
    });
    expect(result.message).toBe("Deep Seek response");
  });

  it("should throw InternalError on invoke failure", async () => {
    vi.mocked(ChatOpenAI).mockImplementation(
      () => ({ invoke: vi.fn().mockRejectedValue(new Error("Invoke error")) }) as never,
    );
    await expect(
      createDeepSeekProvider({ apiKey: "sk-test" }).invoke({
        model: "deepseek-chat",
        message: "Hi",
      }),
    ).rejects.toThrow(InternalError);
  });
});
