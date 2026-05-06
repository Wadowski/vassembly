import { describe, it, expect, vi, beforeEach } from "vitest";

import { UnauthorizedError, WrongParamError } from "@vassembly/errors";

const { mockResolveUserId, mockCompletePasswordReset, mockSendResetPasswordEmail, mockResetPassword } = vi.hoisted(() => ({
  mockResolveUserId: vi.fn(),
  mockCompletePasswordReset: vi.fn(),
  mockSendResetPasswordEmail: vi.fn(),
  mockResetPassword: vi.fn(),
}));

vi.mock("@vassembly/domain-user", () => {
  const impl = {
    queries: {
      resolveUserIdForPasswordReset: mockResolveUserId,
    },
    commands: {
      completePasswordReset: mockCompletePasswordReset,
      sendResetPasswordEmail: mockSendResetPasswordEmail,
      resetPassword: mockResetPassword,
    },
  };
  return { ...impl, default: impl };
});

import { resetPassword } from "./index";

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendResetPasswordEmail.mockResolvedValue(undefined);
  });

  it("should reject tokens that are not 64-character hex strings", async () => {
    const error = new WrongParamError("Token must be 64-character hex string");
    mockResetPassword.mockRejectedValue(error);

    await expect(
      resetPassword({ token: "short", password: "NewPassword1" }),
    ).rejects.toThrow(WrongParamError);
  });

  it("should reject when the token cannot be resolved to a user", async () => {
    const error = new UnauthorizedError("Invalid reset token");
    mockResetPassword.mockRejectedValue(error);

    await expect(
      resetPassword({ token: "a".repeat(64), password: "NewPassword1" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("should return the updated user on success", async () => {
    const user = { 
      id: "user-1", 
      email: "u@example.com", 
      firstName: "U",
      createdAt: new Date(),
      updatedAt: new Date(),
      removedAt: undefined,
      verifiedAt: undefined,
    };
    mockResetPassword.mockResolvedValue({ data: user });

    const result = await resetPassword({ token: "a".repeat(64), password: "NewPassword1" });

    expect(result.user).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      removedAt: user.removedAt,
      verifiedAt: user.verifiedAt,
      lastName: undefined,
    });
    expect(mockResetPassword).toHaveBeenCalledWith({
      token: "a".repeat(64),
      password: "NewPassword1",
    });
  });

  it("should wrap unexpected errors while resolving the token", async () => {
    mockResetPassword.mockRejectedValue(new Error("dao failure"));

    await expect(
      resetPassword({ token: "a".repeat(64), password: "NewPassword1" }),
    ).rejects.toThrow("Failed to reset password");
  });
});
