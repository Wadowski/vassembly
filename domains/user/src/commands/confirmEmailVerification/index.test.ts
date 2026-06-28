import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/client-mongodb/src/connection.js", () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGet, mockUpdate, mockEncode } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
  mockEncode: vi.fn(),
}));

vi.mock("@vassembly/client-encoder", () => ({
  encode: mockEncode,
}));

vi.mock("../../clients", () => ({
  userMongodbDao: {
    get: mockGet,
    update: mockUpdate,
  },
}));

import { confirmEmailVerification } from "./index";
import { NotFoundError, WrongParamError } from "@vassembly/errors";

const VALID_USER_ID = "507f1f77bcf86cd799439011";
const EXPIRED_TOKEN_MESSAGE = "This verification link has expired";
const INVALID_TOKEN_MESSAGE = "Invalid or expired verification link";

describe("confirmEmailVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set verifiedAt and clear verification token fields when token is valid", async () => {
    const future = new Date(Date.now() + 60_000);
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      email: "u@example.com",
      emailVerificationToken: "encoded-token",
      emailVerificationExpiresAt: future,
      emailVerificationIssuedAt: new Date(),
    });
    mockEncode.mockReturnValue("encoded-token");
    mockUpdate.mockResolvedValue(undefined);

    await expect(
      confirmEmailVerification({ userId: VALID_USER_ID, token: "plain-secret" }),
    ).resolves.toBeUndefined();

    expect(mockEncode).toHaveBeenCalledWith("plain-secret");

    const updatePayload = mockUpdate.mock.calls[0]?.[1];
    expect(updatePayload.verifiedAt).toBeInstanceOf(Date);
    expect(updatePayload.emailVerificationToken).toBeNull();
    expect(updatePayload.emailVerificationExpiresAt).toBeNull();
    expect(updatePayload.emailVerificationIssuedAt).toBeNull();
  });

  it("should throw NotFoundError when user does not exist", async () => {
    mockGet.mockResolvedValue(null);

    await expect(
      confirmEmailVerification({ userId: VALID_USER_ID, token: "plain-secret" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw WrongParamError with non-enumerating message when no verification is in progress", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      emailVerificationToken: null,
      emailVerificationExpiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      confirmEmailVerification({ userId: VALID_USER_ID, token: "plain-secret" }),
    ).rejects.toThrow(new WrongParamError(INVALID_TOKEN_MESSAGE));
    expect(mockEncode).not.toHaveBeenCalled();
  });

  it("should throw WrongParamError with non-enumerating message when token is expired", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      emailVerificationToken: "encoded-token",
      emailVerificationExpiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      confirmEmailVerification({ userId: VALID_USER_ID, token: "plain-secret" }),
    ).rejects.toThrow(new WrongParamError(EXPIRED_TOKEN_MESSAGE));
    expect(mockEncode).not.toHaveBeenCalled();
  });

  it("should throw WrongParamError with non-enumerating message when token does not match", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      emailVerificationToken: "encoded-token",
      emailVerificationExpiresAt: new Date(Date.now() + 60_000),
    });
    mockEncode.mockReturnValue("wrong-encoded-token");

    await expect(
      confirmEmailVerification({ userId: VALID_USER_ID, token: "wrong-secret" }),
    ).rejects.toThrow(new WrongParamError(INVALID_TOKEN_MESSAGE));
  });

  it("should throw WrongParamError when user id is invalid", async () => {
    await expect(
      confirmEmailVerification({ userId: "invalid", token: "plain-secret" }),
    ).rejects.toThrow(WrongParamError);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("should throw WrongParamError when token is missing", async () => {
    await expect(
      confirmEmailVerification({ userId: VALID_USER_ID, token: "" }),
    ).rejects.toThrow(WrongParamError);
    expect(mockGet).not.toHaveBeenCalled();
  });
});
