import { vi, describe, it, expect, beforeEach } from "vitest";
import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";
import { InternalError, WrongParamError } from "@vassembly/errors";

import { createLmStudioProvider } from "./createLmStudioProvider";

vi.mock("@langchain/openai");
vi.mock("openai");

const baseUrl = "http://localhost:1234/v1";

describe("createLmStudioProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw WrongParamError when baseUrl is missing", () => {
    expect(() => createLmStudioProvider({ baseUrl: "" })).toThrow(WrongParamError);
  });

  it("should throw WrongParamError for invalid baseUrl", () => {
    expect(() => createLmStudioProvider({ baseUrl: "not-a-valid-url" })).toThrow(
      WrongParamError,
    );
  });

  it("should test connection successfully", async () => {
    vi.mocked(OpenAI).mockImplementation(
      () =>
        ({
          models: {
            list: vi.fn().mockResolvedValue({ data: [{ id: "local-model" }] }),
          },
        }) as never,
    );
    const result = await createLmStudioProvider({ baseUrl }).testConnection();
    expect(result.success).toBe(true);
    expect(result.models).toContain("local-model");
  });

  it("should fail test connection when no models available", async () => {
    vi.mocked(OpenAI).mockImplementation(
      () => ({ models: { list: vi.fn().mockResolvedValue({ data: [] }) } }) as never,
    );
    const result = await createLmStudioProvider({ baseUrl }).testConnection();
    expect(result.success).toBe(false);
    expect(result.error).toBe("No models available in LM Studio");
  });

  it("should invoke model successfully", async () => {
    vi.mocked(ChatOpenAI).mockImplementation(
      () =>
        ({ invoke: vi.fn().mockResolvedValue({ content: "Local response" }) }) as never,
    );
    const result = await createLmStudioProvider({ baseUrl }).invoke({
      model: "local-model",
      message: "Hello",
    });
    expect(result.message).toBe("Local response");
  });

  it("should throw InternalError on invoke failure", async () => {
    vi.mocked(ChatOpenAI).mockImplementation(
      () => ({ invoke: vi.fn().mockRejectedValue(new Error("Invoke error")) }) as never,
    );
    await expect(
      createLmStudioProvider({ baseUrl }).invoke({ model: "local-model", message: "Hi" }),
    ).rejects.toThrow(InternalError);
  });
});
