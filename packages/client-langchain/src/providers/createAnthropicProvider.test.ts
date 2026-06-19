import { vi, describe, it, expect, beforeEach } from "vitest";
import { ChatAnthropic } from "@langchain/anthropic";
import { InternalError, WrongParamError } from "@vassembly/errors";

import { createAnthropicProvider } from "./createAnthropicProvider";

vi.mock("@langchain/anthropic");
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(),
}));

describe("createAnthropicProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw WrongParamError when apiKey is missing", () => {
    expect(() => createAnthropicProvider({ apiKey: "" })).toThrow(WrongParamError);
  });

  it("should test connection successfully with available models", async () => {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    vi.mocked(Anthropic).mockImplementation(
      () =>
        ({
          models: {
            list: vi.fn().mockResolvedValue({
              data: [{ id: "claude-sonnet-4-20250514" }],
            }),
          },
        }) as never,
    );
    const result = await createAnthropicProvider({ apiKey: "anthropic-key" }).testConnection();
    expect(result.success).toBe(true);
    expect(result.models).toContain("claude-sonnet-4-20250514");
  });

  it("should fail test connection when no models available", async () => {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    vi.mocked(Anthropic).mockImplementation(
      () =>
        ({
          models: {
            list: vi.fn().mockResolvedValue({ data: [] }),
          },
        }) as never,
    );
    const result = await createAnthropicProvider({ apiKey: "anthropic-key" }).testConnection();
    expect(result.success).toBe(false);
    expect(result.error).toBe("No models available from Anthropic");
  });

  it("should invoke model successfully", async () => {
    vi.mocked(ChatAnthropic).mockImplementation(
      () =>
        ({ invoke: vi.fn().mockResolvedValue({ content: "Anthropic response" }) }) as never,
    );
    const result = await createAnthropicProvider({ apiKey: "anthropic-key" }).invoke({
      model: "claude-sonnet-4-20250514",
      message: "Hello",
    });
    expect(result.message).toBe("Anthropic response");
  });

  it("should throw InternalError on getModels failure", async () => {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    vi.mocked(Anthropic).mockImplementation(
      () =>
        ({
          models: {
            list: vi.fn().mockRejectedValue(new Error("List error")),
          },
        }) as never,
    );
    await expect(
      createAnthropicProvider({ apiKey: "anthropic-key" }).getModels(),
    ).rejects.toThrow(InternalError);
  });
});
