import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetManyRaw } = vi.hoisted(() => ({
  mockGetManyRaw: vi.fn(),
}));

vi.mock("../clients", () => ({
  userMongodbDao: {
    getManyRaw: mockGetManyRaw,
  },
}));

import { getByEmail } from "./getByEmail";

describe("getByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return active user when one exists for email", async () => {
    mockGetManyRaw.mockResolvedValue([
      {
        id: "507f1f77bcf86cd799439011",
        email: "keep@example.com",
        firstName: "A",
      },
    ]);

    const user = await getByEmail({ email: "keep@example.com" });

    expect(user?.id).toBe("507f1f77bcf86cd799439011");
    expect(mockGetManyRaw).toHaveBeenCalledWith(
      {
        email: "keep@example.com",
        $or: [{ removedAt: { $exists: false } }, { removedAt: null }],
      },
      { limit: 1 },
    );
  });

  it("should return null when no active user matches", async () => {
    mockGetManyRaw.mockResolvedValue([]);

    const user = await getByEmail({ email: "gone@example.com" });

    expect(user).toBeNull();
  });
});
