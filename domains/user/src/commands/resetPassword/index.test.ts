import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/client-mongodb/src/connection.js", () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockResolveUserId } = vi.hoisted(() => ({
  mockResolveUserId: vi.fn(),
}));

const { mockCompleteReset } = vi.hoisted(() => ({
  mockCompleteReset: vi.fn(),
}));

const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
}));

vi.mock("../resolveUserIdForPasswordReset", () => ({
  resolveUserIdForPasswordReset: mockResolveUserId,
}));

vi.mock("../completePasswordReset", () => ({
  completePasswordReset: mockCompleteReset,
}));

vi.mock("../sendResetPasswordEmail", () => ({
  sendResetPasswordEmail: mockSendEmail,
}));

import { resetPassword } from "./index";
import { CommonError, InternalError, UnauthorizedError, WrongParamError } from "@vassembly/errors";
import type { UserModel } from "../../model";

const VALID_TOKEN = "a".repeat(64);
const VALID_PASSWORD = "ValidPass123!";

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should complete password reset and send confirmation email when token is valid", async () => {
    const user = {
      id: "user-123",
      email: "user@example.com",
      firstName: "John",
      lastName: "Doe",
    } as unknown as UserModel;

    mockResolveUserId.mockResolvedValue("user-123");
    mockCompleteReset.mockResolvedValue({ data: user });
    mockSendEmail.mockResolvedValue(undefined);

    const result = await resetPassword({
      token: VALID_TOKEN,
      password: VALID_PASSWORD,
    });

    expect(result.data).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: undefined,
      updatedAt: undefined,
      removedAt: undefined,
      verifiedAt: undefined,
    });
    expect(mockResolveUserId).toHaveBeenCalledWith({ plainToken: VALID_TOKEN });
    expect(mockCompleteReset).toHaveBeenCalledWith({
      userId: "user-123",
      plainToken: VALID_TOKEN,
      newPassword: VALID_PASSWORD,
    });
    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      resetUrl: "",
    });
  });

  it("should throw WrongParamError when token format is invalid", async () => {
    const invalidToken = "not-a-hex-token";

    await expect(
      resetPassword({
        token: invalidToken,
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow(WrongParamError);

    expect(mockResolveUserId).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when token cannot be resolved", async () => {
    mockResolveUserId.mockResolvedValue(null);

    await expect(
      resetPassword({
        token: VALID_TOKEN,
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow(UnauthorizedError);

    expect(mockCompleteReset).not.toHaveBeenCalled();
  });

  it("should throw InternalError when resolveUserIdForPasswordReset fails with non-CommonError", async () => {
    mockResolveUserId.mockRejectedValue(new Error("Database error"));

    await expect(
      resetPassword({
        token: VALID_TOKEN,
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow(InternalError);
  });

  it("should rethrow CommonError from resolveUserIdForPasswordReset", async () => {
    const commonError = new WrongParamError("Token validation failed");
    mockResolveUserId.mockRejectedValue(commonError);

    await expect(
      resetPassword({
        token: VALID_TOKEN,
        password: VALID_PASSWORD,
      }),
    ).rejects.toBe(commonError);
  });

  it("should throw InternalError when completePasswordReset fails with non-CommonError", async () => {
    mockResolveUserId.mockResolvedValue("user-123");
    mockCompleteReset.mockRejectedValue(new Error("Update failed"));

    await expect(
      resetPassword({
        token: VALID_TOKEN,
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow(InternalError);
  });

  it("should rethrow CommonError from completePasswordReset", async () => {
    const commonError = new UnauthorizedError("Token expired");
    mockResolveUserId.mockResolvedValue("user-123");
    mockCompleteReset.mockRejectedValue(commonError);

    await expect(
      resetPassword({
        token: VALID_TOKEN,
        password: VALID_PASSWORD,
      }),
    ).rejects.toBe(commonError);
  });

  it("should throw InternalError when completePasswordReset returns no user data", async () => {
    mockResolveUserId.mockResolvedValue("user-123");
    mockCompleteReset.mockResolvedValue({ data: null });

    await expect(
      resetPassword({
        token: VALID_TOKEN,
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow(InternalError);
  });

  it("should continue even if sendResetPasswordEmail fails", async () => {
    const user = {
      id: "user-123",
      email: "user@example.com",
      firstName: "John",
    } as unknown as UserModel;

    mockResolveUserId.mockResolvedValue("user-123");
    mockCompleteReset.mockResolvedValue({ data: user });
    mockSendEmail.mockRejectedValue(new Error("Email service down"));

    const result = await resetPassword({
      token: VALID_TOKEN,
      password: VALID_PASSWORD,
    });

    expect(result.data).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: undefined,
      updatedAt: undefined,
      removedAt: undefined,
      verifiedAt: undefined,
    });
  });

  it("should rethrow CommonError from sendResetPasswordEmail", async () => {
    const user = {
      id: "user-123",
      email: "user@example.com",
    } as unknown as UserModel;

    const commonError = new WrongParamError("Invalid email");
    mockResolveUserId.mockResolvedValue("user-123");
    mockCompleteReset.mockResolvedValue({ data: user });
    mockSendEmail.mockRejectedValue(commonError);

    await expect(
      resetPassword({
        token: VALID_TOKEN,
        password: VALID_PASSWORD,
      }),
    ).rejects.toBe(commonError);
  });
});
