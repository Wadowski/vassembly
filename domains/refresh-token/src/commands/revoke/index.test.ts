import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../updateDb");
vi.mock("../../queries");

const { mockEncode } = vi.hoisted(() => {
  const mockEncode = vi.fn();
  return { mockEncode };
});

const { mockUpdateRefreshToken } = vi.hoisted(() => {
  const mockUpdateRefreshToken = vi.fn();
  return { mockUpdateRefreshToken };
});

const { mockGetByTokenHash } = vi.hoisted(() => {
  const mockGetByTokenHash = vi.fn();
  return { mockGetByTokenHash };
});

vi.mock("@vassembly/client-encoder", () => ({
  encode: mockEncode,
}));

vi.mock("../updateDb", () => ({
  update: mockUpdateRefreshToken,
}));

vi.mock("../../queries", () => ({
  getByTokenHash: mockGetByTokenHash,
}));

import { revoke } from "./index";
import { NotFoundError } from "@vassembly/errors";

describe("revokeRefreshToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should revoke an existing refresh token", async () => {
    const tokenString = "refresh-token-string";
    const tokenHash = "hashed-token";
    const tokenId = "token-id-123";

    mockEncode.mockReturnValue(tokenHash);
    mockGetByTokenHash.mockResolvedValue({
      data: {
        id: tokenId,
        userId: "user-123",
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        revokedAt: null,
      },
    });

    const revokedAt = new Date();
    mockUpdateRefreshToken.mockResolvedValue({
      data: {
        id: tokenId,
        revokedAt,
      },
    });

    const result = await revoke({
      refreshToken: tokenString,
    });

    expect(result.data.id).toBe(tokenId);
    expect(result.data.revokedAt).toBeDefined();
  });

  it("should throw NotFoundError when token does not exist", async () => {
    const tokenString = "non-existent-token";
    const tokenHash = "hashed-token";

    mockEncode.mockReturnValue(tokenHash);
    mockGetByTokenHash.mockResolvedValue({
      data: { id: undefined },
    });

    await expect(
      revoke({ refreshToken: tokenString })
    ).rejects.toThrow(
      new NotFoundError("Refresh token not found")
    );
  });
});
