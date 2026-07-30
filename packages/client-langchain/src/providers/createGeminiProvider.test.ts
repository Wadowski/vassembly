import { afterEach, beforeEach, vi, describe, it, expect } from "vitest";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { InternalError, WrongParamError } from "@vassembly/errors";

import { createGeminiProvider } from "./createGeminiProvider";

vi.mock("@langchain/google-genai");

const createModelsResponse = (
  models: Array<{ name: string; supportedGenerationMethods: string[] }>,
): Response =>
  new Response(
    JSON.stringify({
      models,
    }),
    { status: 200 },
  );

describe("createGeminiProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should throw WrongParamError when apiKey is missing", () => {
    expect(() => createGeminiProvider({ apiKey: "" })).toThrow(WrongParamError);
  });

  it("should test connection successfully with generative models", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createModelsResponse([
        {
          name: "models/gemini-pro",
          supportedGenerationMethods: ["generateContent"],
        },
      ]),
    );
    const result = await createGeminiProvider({ apiKey: "gemini-key" }).testConnection();
    expect(result.success).toBe(true);
    expect(result.models).toContain("gemini-pro");
  });

  it("should fail test connection when no generative models available", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createModelsResponse([
        {
          name: "models/embedding-model",
          supportedGenerationMethods: ["embedContent"],
        },
      ]),
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
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("List error", { status: 500 }),
    );
    await expect(
      createGeminiProvider({ apiKey: "gemini-key" }).getModels(),
    ).rejects.toThrow(InternalError);
  });
});
