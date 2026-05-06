import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetManyRaw, mockEncode } = vi.hoisted(() => ({
  mockGetManyRaw: vi.fn(),
  mockEncode: vi.fn(),
}));

vi.mock("@vassembly/client-encoder", () => ({
  encode: mockEncode,
}));

vi.mock("../../clients", () => ({
  userMongodbDao: {
    getManyRaw: mockGetManyRaw,
  },
}));

import { resolveUserIdForPasswordReset } from "./index";

describe("resolveUserIdForPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return matching user id when encoded token matches", async () => {
    mockEncode.mockReturnValue("encoded-secret");
    mockGetManyRaw.mockResolvedValue([{ id: "u1" }]);

    const result = await resolveUserIdForPasswordReset({ plainToken: "secret" });

    expect(result).toBe("u1");
    expect(mockEncode).toHaveBeenCalledWith("secret");
    expect(mockGetManyRaw).toHaveBeenCalledWith(
      {
        passwordResetExpiresAt: { $gt: expect.any(Date) },
        passwordResetToken: "encoded-secret",
        $or: [{ removedAt: { $exists: false } }, { removedAt: null }],
      },
      { limit: 1 },
    );
  });

  it("should return null when no user matches encoded token", async () => {
    mockEncode.mockReturnValue("encoded-secret");
    mockGetManyRaw.mockResolvedValue([]);

    const result = await resolveUserIdForPasswordReset({ plainToken: "wrong" });

    expect(result).toBeNull();
  });

  it("should return null when token is empty or whitespace", async () => {
    expect(await resolveUserIdForPasswordReset({ plainToken: "" })).toBeNull();
    expect(await resolveUserIdForPasswordReset({ plainToken: "   " })).toBeNull();
    expect(mockGetManyRaw).not.toHaveBeenCalled();
  });
});
