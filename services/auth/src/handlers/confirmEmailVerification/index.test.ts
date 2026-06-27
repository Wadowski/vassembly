import { describe, it, expect, vi, beforeEach } from "vitest";

import { WrongParamError } from "@vassembly/errors";

const { mockConfirmEmailVerification, mockCheckAndCompleteOnboarding } = vi.hoisted(() => ({
  mockConfirmEmailVerification: vi.fn(),
  mockCheckAndCompleteOnboarding: vi.fn(),
}));

vi.mock("@vassembly/domain-user", () => {
  const impl = {
    commands: {
      confirmEmailVerification: mockConfirmEmailVerification,
    },
  };
  return { ...impl, default: impl };
});

vi.mock("../checkAndCompleteOnboarding", () => ({
  checkAndCompleteOnboarding: mockCheckAndCompleteOnboarding,
}));

import { confirmEmailVerification } from "./index";

const VALID_USER_ID = "507f1f77bcf86cd799439011";

describe("confirmEmailVerification handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirmEmailVerification.mockResolvedValue(undefined);
    mockCheckAndCompleteOnboarding.mockResolvedValue(undefined);
  });

  it("should return success when email verification is confirmed", async () => {
    const result = await confirmEmailVerification({
      userId: VALID_USER_ID,
      token: "plain-secret",
    });

    expect(result).toEqual({ success: true });
    expect(mockConfirmEmailVerification).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      token: "plain-secret",
    });
    expect(mockCheckAndCompleteOnboarding).toHaveBeenCalledWith({ userId: VALID_USER_ID });
  });

  it("should surface domain validation errors for invalid or expired tokens", async () => {
    mockConfirmEmailVerification.mockRejectedValue(
      new WrongParamError("Invalid or expired verification link"),
    );

    await expect(
      confirmEmailVerification({ userId: VALID_USER_ID, token: "bad-token" }),
    ).rejects.toThrow(WrongParamError);
    expect(mockCheckAndCompleteOnboarding).not.toHaveBeenCalled();
  });

  it("should wrap unexpected errors in InternalError", async () => {
    mockConfirmEmailVerification.mockRejectedValue(new Error("database down"));

    await expect(
      confirmEmailVerification({ userId: VALID_USER_ID, token: "plain-secret" }),
    ).rejects.toThrow("Failed to confirm email verification");
  });
});
