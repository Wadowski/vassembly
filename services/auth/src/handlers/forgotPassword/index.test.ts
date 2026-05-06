import { describe, it, expect, vi, beforeEach } from "vitest";

import { WrongParamError } from "@vassembly/errors";

const { mockInitiatePasswordReset } = vi.hoisted(
  () => ({
    mockInitiatePasswordReset: vi.fn(),
  }),
);

vi.mock("@vassembly/domain-user", () => {
  const impl = {
    commands: {
      initiatePasswordReset: mockInitiatePasswordReset,
    },
  };
  return { ...impl, default: impl };
});

import { forgotPassword } from "./index";
import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from "./constants";

describe("forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a success message when password reset is initiated", async () => {
    mockInitiatePasswordReset.mockResolvedValue(undefined);

    const result = await forgotPassword({ email: "user@example.com" });

    expect(result.message).toBe(FORGOT_PASSWORD_SUCCESS_MESSAGE);
    expect(mockInitiatePasswordReset).toHaveBeenCalledWith({
      email: "user@example.com",
    });
  });

  it("should surface domain validation errors", async () => {
    mockInitiatePasswordReset.mockRejectedValue(new WrongParamError("Invalid email"));

    await expect(forgotPassword({ email: "user@example.com" })).rejects.toThrow(WrongParamError);
  });

  it("should wrap unexpected errors in InternalError", async () => {
    mockInitiatePasswordReset.mockRejectedValue(new Error("database down"));

    await expect(forgotPassword({ email: "user@example.com" })).rejects.toThrow(
      "Failed to initiate password reset",
    );
  });
});
