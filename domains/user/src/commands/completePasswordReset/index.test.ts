import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/client-mongodb/src/connection.js", () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGet, mockUpdate } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
}));

const { mockEncode, mockHash } = vi.hoisted(() => ({
  mockEncode: vi.fn(),
  mockHash: vi.fn(),
}));

const { mockGetDbByIdHandler } = vi.hoisted(() => ({
  mockGetDbByIdHandler: vi.fn(),
}));

vi.mock("@vassembly/client-encoder", () => ({
  encode: mockEncode,
  hash: mockHash,
}));

vi.mock("@vassembly/queries", () => ({
  getDbById: vi.fn(() => mockGetDbByIdHandler),
}));

vi.mock("../../clients", () => ({
  userMongodbDao: {
    get: mockGet,
    update: mockUpdate,
  },
}));

import { completePasswordReset } from "./index";
import { NotFoundError, UnauthorizedError, WrongParamError } from "@vassembly/errors";
import type { UserModel } from "../../model";

const VALID_USER_ID = "507f1f77bcf86cd799439011";
const VALID_PASSWORD = "ValidPass123!";

describe("completePasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update password and clear reset fields when token is valid", async () => {
    const future = new Date(Date.now() + 60_000);
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      email: "u@example.com",
      passwordResetToken: "encoded-token",
      passwordResetExpiresAt: future,
    });
    mockEncode.mockReturnValue("encoded-token");
    mockHash.mockResolvedValue("new-hash");
    mockUpdate.mockResolvedValue(undefined);
    const refreshed = {
      id: VALID_USER_ID,
      email: "u@example.com",
      firstName: "A",
      lastName: "B",
      passwordHash: "new-hash",
    } as unknown as UserModel;
    mockGetDbByIdHandler.mockResolvedValue({ data: refreshed });

    const result = await completePasswordReset({
      userId: VALID_USER_ID,
      plainToken: "plain-secret",
      newPassword: VALID_PASSWORD,
    });

    expect(result.data.id).toBe(VALID_USER_ID);
    expect(result.data.passwordHash).toBeUndefined();
    expect(mockEncode).toHaveBeenCalledWith("plain-secret");
    expect(mockHash).toHaveBeenCalledWith({ text: VALID_PASSWORD });
  });

  it("should throw NotFoundError when user does not exist", async () => {
    mockGet.mockResolvedValue(null);

    await expect(
      completePasswordReset({
        userId: VALID_USER_ID,
        plainToken: "plain-secret",
        newPassword: VALID_PASSWORD,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw WrongParamError when no reset is in progress", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      passwordResetToken: undefined,
      passwordResetExpiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      completePasswordReset({
        userId: VALID_USER_ID,
        plainToken: "plain-secret",
        newPassword: VALID_PASSWORD,
      }),
    ).rejects.toThrow(WrongParamError);
    expect(mockEncode).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when token is expired", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      passwordResetToken: "encoded-token",
      passwordResetExpiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      completePasswordReset({
        userId: VALID_USER_ID,
        plainToken: "plain-secret",
        newPassword: VALID_PASSWORD,
      }),
    ).rejects.toThrow(UnauthorizedError);
    expect(mockEncode).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when token does not match", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      passwordResetToken: "encoded-token",
      passwordResetExpiresAt: new Date(Date.now() + 60_000),
    });
    mockEncode.mockReturnValue("wrong-encoded-token");

    await expect(
      completePasswordReset({
        userId: VALID_USER_ID,
        plainToken: "wrong-secret",
        newPassword: VALID_PASSWORD,
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("should throw WrongParamError when new password fails validation", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      passwordResetToken: "encoded-token",
      passwordResetExpiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      completePasswordReset({
        userId: VALID_USER_ID,
        plainToken: "plain-secret",
        newPassword: "short",
      }),
    ).rejects.toThrow(WrongParamError);
    expect(mockEncode).not.toHaveBeenCalled();
  });

  it("should throw WrongParamError for invalid user id", async () => {
    await expect(
      completePasswordReset({
        userId: "invalid",
        plainToken: "plain-secret",
        newPassword: VALID_PASSWORD,
      }),
    ).rejects.toThrow(WrongParamError);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("should throw WrongParamError when plain token is missing", async () => {
    await expect(
      completePasswordReset({
        userId: VALID_USER_ID,
        plainToken: "",
        newPassword: VALID_PASSWORD,
      }),
    ).rejects.toThrow(WrongParamError);
    expect(mockGet).not.toHaveBeenCalled();
  });
});
