import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDeleteAccount } = vi.hoisted(() => ({
  mockDeleteAccount: vi.fn(),
}));

vi.mock("@vassembly/domain-user", () => ({
  default: {
    commands: {
      deleteAccount: mockDeleteAccount,
    },
  },
}));

import { InternalError, NotFoundError } from "@vassembly/errors";

import { deleteAccount } from "./index";

describe("deleteAccount handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return success when domain succeeds", async () => {
    mockDeleteAccount.mockResolvedValue({ success: true });

    const result = await deleteAccount({ userId: "507f1f77bcf86cd799439011" });

    expect(result).toEqual({ success: true });
    expect(mockDeleteAccount).toHaveBeenCalledWith({
      userId: "507f1f77bcf86cd799439011",
    });
  });

  it("should surface domain common errors", async () => {
    mockDeleteAccount.mockRejectedValue(new NotFoundError("missing"));

    await expect(deleteAccount({ userId: "507f1f77bcf86cd799439011" })).rejects.toThrow(
      NotFoundError,
    );
  });

  it("should wrap unexpected errors", async () => {
    mockDeleteAccount.mockRejectedValue(new Error("boom"));

    await expect(deleteAccount({ userId: "507f1f77bcf86cd799439011" })).rejects.toThrow(
      InternalError,
    );
  });
});
