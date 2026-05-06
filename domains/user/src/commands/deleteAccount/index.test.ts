import { describe, it, expect, vi, beforeEach } from "vitest";

import { NotFoundError } from "@vassembly/errors";

const { mockGet, mockRemove } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockRemove: vi.fn(),
}));

vi.mock("../../clients", () => ({
  userMongodbDao: {
    get: mockGet,
    remove: mockRemove,
  },
}));

import { deleteAccount } from "./index";

const VALID_USER_ID = "507f1f77bcf86cd799439011";

describe("deleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should soft-remove user when active", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      email: "a@b.com",
    });

    const result = await deleteAccount({ userId: VALID_USER_ID });

    expect(result).toEqual({ success: true });
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it("should return success when user already removed (idempotent)", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      email: "a@b.com",
      removedAt: new Date(),
    });

    const result = await deleteAccount({ userId: VALID_USER_ID });

    expect(result).toEqual({ success: true });
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("should throw when user not found", async () => {
    mockGet.mockResolvedValue(null);

    await expect(deleteAccount({ userId: VALID_USER_ID })).rejects.toThrow(NotFoundError);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("should reject invalid user id shape", async () => {
    await expect(deleteAccount({ userId: "not-object-id" })).rejects.toThrow();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
