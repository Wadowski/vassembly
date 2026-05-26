import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/client-mongodb/src/connection.js", () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetModelById } = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
}));

const { mockCompareHash, mockHash } = vi.hoisted(() => ({
  mockCompareHash: vi.fn(),
  mockHash: vi.fn(),
}));

const { mockDaoUpdate } = vi.hoisted(() => ({
  mockDaoUpdate: vi.fn(),
}));

vi.mock("@vassembly/client-encoder", () => ({
  compareHash: mockCompareHash,
  hash: mockHash,
}));

vi.mock("../../queries/getModelById", () => ({
  getModelById: mockGetModelById,
}));

vi.mock("../../clients", () => ({
  userMongodbDao: {
    update: mockDaoUpdate,
  },
}));

import { changePassword } from "./index";
import { NotFoundError, UnauthorizedError, ValidationError, WrongParamError } from "@vassembly/errors";

const VALID_USER_ID = "507f1f77bcf86cd799439011";
const CURRENT = "OldPass456!";
const NEW_VALID = "NewPass789!";

describe("changePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update password when current password and new password policy validate", async () => {
    mockGetModelById
      .mockResolvedValueOnce({
        data: {
          id: VALID_USER_ID,
          passwordHash: "stored-hash",
        },
      })
      .mockResolvedValueOnce({
        data: { id: VALID_USER_ID, email: "x@example.com" },
      });

    mockCompareHash.mockResolvedValue(true);
    mockHash.mockResolvedValue("new-hash");
    mockDaoUpdate.mockResolvedValue(undefined);

    await changePassword({
      userId: VALID_USER_ID,
      currentPassword: CURRENT,
      newPassword: NEW_VALID,
    });

    expect(mockDaoUpdate).toHaveBeenCalled();
    expect(mockHash).toHaveBeenCalledWith({ text: NEW_VALID });
  });

  it("should throw ValidationError when new password violates policy", async () => {
    await expect(
      changePassword({
        userId: VALID_USER_ID,
        currentPassword: CURRENT,
        newPassword: "short",
      }),
    ).rejects.toThrow(ValidationError);
    expect(mockGetModelById).not.toHaveBeenCalled();
  });

  it("should throw WrongParamError when new password equals current password", async () => {
    await expect(
      changePassword({
        userId: VALID_USER_ID,
        currentPassword: CURRENT,
        newPassword: CURRENT,
      }),
    ).rejects.toThrow(WrongParamError);
    expect(mockGetModelById).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when current password does not match", async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: VALID_USER_ID,
        passwordHash: "stored-hash",
      },
    });
    mockCompareHash.mockResolvedValue(false);

    await expect(
      changePassword({
        userId: VALID_USER_ID,
        currentPassword: "wrong-password",
        newPassword: NEW_VALID,
      }),
    ).rejects.toThrow(UnauthorizedError);

    expect(mockDaoUpdate).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when user has no stored password hash", async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: VALID_USER_ID,
      },
    });

    await expect(
      changePassword({
        userId: VALID_USER_ID,
        currentPassword: CURRENT,
        newPassword: NEW_VALID,
      }),
    ).rejects.toThrow(UnauthorizedError);

    expect(mockCompareHash).not.toHaveBeenCalled();
  });

  it("should propagate NotFoundError when user lookup fails", async () => {
    mockGetModelById.mockRejectedValue(new NotFoundError("User not found"));

    await expect(
      changePassword({
        userId: VALID_USER_ID,
        currentPassword: CURRENT,
        newPassword: NEW_VALID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw WrongParamError when user id format is invalid", async () => {
    await expect(
      changePassword({
        userId: "not-valid",
        currentPassword: CURRENT,
        newPassword: NEW_VALID,
      }),
    ).rejects.toThrow(WrongParamError);
  });
});
