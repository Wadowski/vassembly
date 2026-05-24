import { vi, describe, it, expect, beforeEach } from "vitest";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { InternalError, WrongParamError } from "@vassembly/errors";

import { createGeminiProvider } from "./createGeminiProvider";

vi.mock("@langchain/google-genai");
vi.mock("@google/genai", () => ({ GoogleGenAI: vi.fn() }));

describe("createGeminiProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw WrongParamError when apiKey is missing", () => {
    expect(() => createGeminiProvider({ apiKey: "" })).toThrow(WrongParamError);
  });

  it("should test connection successfully with generative models", async () => {
    const { GoogleGenAI } = await import("@google/genai");
    const pager = (async function* () {
      yield { name: "models/gemini-pro", supportedActions: ["generateContent"] };
    })();
    vi.mocked(GoogleGenAI).mockImplementation(
      () => ({ models: { list: vi.fn().mockResolvedValue(pager) } }) as never,
    );
    const result = await createGeminiProvider({ apiKey: "gemini-key" }).testConnection();
    expect(result.success).toBe(true);
    expect(result.models).toContain("gemini-pro");
  });

  it("should fail test connection when no generative models available", async () => {
    const { GoogleGenAI } = await import("@google/genai");
    const pager = (async function* () {
      yield { name: "models/embedding-model", supportedActions: ["embedContent"] };
    })();
    vi.mocked(GoogleGenAI).mockImplementation(
      () => ({ models: { list: vi.fn().mockResolvedValue(pager) } }) as never,
    );
    const result = await createGeminiProvider({ apiKey: "gemini-key" }).testConnection();
    expect(result.success).toBe(false);
    expect(result.error).toBe("No generative models available");
  });

  it("should invoke model successfully", async () => {
    vi.mocked(ChatGoogleGenerativeAI).mockImplementation(
      () =>
        ({ invoke: vi.fn().mockResolvedValue({ content: "Gemini response" }) }) as never,
    );
    const result = await createGeminiProvider({ apiKey: "gemini-key" }).invoke({
      model: "gemini-pro",
      message: "Hello",
    });
    expect(result.message).toBe("Gemini response");
  });

  it("should throw InternalError on getModels failure", async () => {
    const { GoogleGenAI } = await import("@google/genai");
    vi.mocked(GoogleGenAI).mockImplementation(
      () =>
        ({ models: { list: vi.fn().mockRejectedValue(new Error("List error")) } }) as never,
    );
    await expect(
      createGeminiProvider({ apiKey: "gemini-key" }).getModels(),
    ).rejects.toThrow(InternalError);
  });
});
