import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { listGeminiModels } from "./listGeminiModels";

const GEMINI_MODELS_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const createModelsResponse = (
  models: Array<{ name: string; supportedGenerationMethods: string[] }>,
  nextPageToken?: string,
): Response =>
  new Response(
    JSON.stringify({
      models,
      ...(nextPageToken ? { nextPageToken } : {}),
    }),
    { status: 200 },
  );

describe("listGeminiModels", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return generative model ids from the Gemini models endpoint", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createModelsResponse([
        {
          name: "models/gemini-2.0-flash",
          supportedGenerationMethods: ["generateContent"],
        },
        {
          name: "models/text-embedding-004",
          supportedGenerationMethods: ["embedContent"],
        },
      ]),
    );

    const models = await listGeminiModels({ apiKey: "gemini-key" });

    expect(models).toEqual(["gemini-2.0-flash"]);
    expect(fetch).toHaveBeenCalledWith(
      `${GEMINI_MODELS_API_URL}?key=gemini-key`,
    );
  });

  it("should paginate through all model pages", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        createModelsResponse(
          [
            {
              name: "models/gemini-2.0-flash",
              supportedGenerationMethods: ["generateContent"],
            },
          ],
          "next-page-token",
        ),
      )
      .mockResolvedValueOnce(
        createModelsResponse([
          {
            name: "models/gemini-1.5-pro",
            supportedGenerationMethods: ["generateContent"],
          },
        ]),
      );

    const models = await listGeminiModels({ apiKey: "gemini-key" });

    expect(models).toEqual(["gemini-2.0-flash", "gemini-1.5-pro"]);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      `${GEMINI_MODELS_API_URL}?key=gemini-key&pageToken=next-page-token`,
    );
  });

  it("should throw when the Gemini models endpoint returns an error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Invalid API key", { status: 401 }),
    );

    await expect(listGeminiModels({ apiKey: "invalid-key" })).rejects.toThrow(
      "Failed to list Gemini models (401)",
    );
  });
});
