import { describe, it, expect, vi, beforeEach } from "vitest";

import { ConflictError, TooManyRequestsError } from "@vassembly/errors";

const {
  mockGetModelById,
  mockRequestEmailVerification,
  mockSendVerificationEmail,
} = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockRequestEmailVerification: vi.fn(),
  mockSendVerificationEmail: vi.fn(),
}));

vi.mock("@vassembly/domain-user", () => {
  const buildVerificationUrl = vi.fn(
    ({ token }: { token: string }) => `https://app.example.com/verify?token=${token}`,
  );
  const impl = {
    queries: {
      getModelById: mockGetModelById,
    },
    commands: {
      requestEmailVerification: mockRequestEmailVerification,
      sendVerificationEmail: mockSendVerificationEmail,
    },
  };
  return { ...impl, default: impl, buildVerificationUrl };
});

vi.mock("@vassembly/client-encoder", () => ({
  randomString: vi.fn(() => "generated-verification-token"),
}));

import { resendEmailVerification } from "./index";

const VALID_USER_ID = "507f1f77bcf86cd799439011";

describe("resendEmailVerification handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestEmailVerification.mockResolvedValue(undefined);
    mockSendVerificationEmail.mockResolvedValue(undefined);
  });

  it("should return success when user is unverified and cooldown has elapsed", async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: VALID_USER_ID,
        email: "user@example.com",
        verifiedAt: null,
        emailVerificationIssuedAt: new Date(Date.now() - 120_000),
      },
    });

    const result = await resendEmailVerification({ userId: VALID_USER_ID });

    expect(result).toEqual({ success: true });
    expect(mockRequestEmailVerification).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      token: "generated-verification-token",
    });
    expect(mockSendVerificationEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      verificationUrl: "https://app.example.com/verify?token=generated-verification-token",
    });
  });

  it("should throw ConflictError when email is already verified", async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: VALID_USER_ID,
        email: "user@example.com",
        verifiedAt: new Date(),
      },
    });

    await expect(resendEmailVerification({ userId: VALID_USER_ID })).rejects.toThrow(
      new ConflictError("Email already verified"),
    );
    expect(mockRequestEmailVerification).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("should throw TooManyRequestsError with retryAfterSeconds when resend is within cooldown", async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: VALID_USER_ID,
        email: "user@example.com",
        verifiedAt: null,
        emailVerificationIssuedAt: new Date(),
      },
    });

    let caughtError: unknown;
    try {
      await resendEmailVerification({ userId: VALID_USER_ID });
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(TooManyRequestsError);
    expect((caughtError as TooManyRequestsError).retryAfterSeconds).toBeGreaterThan(0);
    expect(mockRequestEmailVerification).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("should wrap unexpected errors in InternalError", async () => {
    mockGetModelById.mockRejectedValue(new Error("database down"));

    await expect(resendEmailVerification({ userId: VALID_USER_ID })).rejects.toThrow(
      "Failed to resend verification email",
    );
  });
});
