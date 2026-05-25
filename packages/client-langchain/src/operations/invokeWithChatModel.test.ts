import { vi, describe, it, expect } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { InternalError } from "@vassembly/errors";

import { invokeWithChatModel } from "./invokeWithChatModel";

describe("invokeWithChatModel", () => {
  it("should invoke chat model and return message content", async () => {
    const createChatModel = vi.fn().mockReturnValue({
      invoke: vi.fn().mockResolvedValue({ content: "Test response" }),
    });

    const result = await invokeWithChatModel({
      createChatModel,
      invokeParams: { model: "test-model", message: "Hello" },
      errorMessage: "Failed to invoke",
    });

    expect(result.message).toBe("Test response");
    expect(result.model).toBe("test-model");
    expect(createChatModel).toHaveBeenCalledWith("test-model");
  });

  it("should pass HumanMessage to chat model invoke", async () => {
    const invoke = vi.fn().mockResolvedValue({ content: "Response" });
    const createChatModel = vi.fn().mockReturnValue({ invoke });

    await invokeWithChatModel({
      createChatModel,
      invokeParams: { model: "test-model", message: "Hello world" },
      errorMessage: "Failed to invoke",
    });

    expect(invoke).toHaveBeenCalledWith([new HumanMessage("Hello world")]);
  });

  it("should throw InternalError when invoke fails", async () => {
    const createChatModel = vi.fn().mockReturnValue({
      invoke: vi.fn().mockRejectedValue(new Error("Model error")),
    });

    await expect(
      invokeWithChatModel({
        createChatModel,
        invokeParams: { model: "test-model", message: "Hello" },
        errorMessage: "Failed to invoke model",
      }),
    ).rejects.toThrow(InternalError);
  });
});
