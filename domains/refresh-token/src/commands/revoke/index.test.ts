import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/client-encoder");
vi.mock("../updateDb");
vi.mock("../../queries");

const { mockHash } = vi.hoisted(() => {
  const mockHash = vi.fn();
  return { mockHash };
});

const { mockUpdateRefreshToken } = vi.hoisted(() => {
  const mockUpdateRefreshToken = vi.fn();
  return { mockUpdateRefreshToken };
});

const { mockGetRefreshTokenByTokenHash } = vi.hoisted(() => {
  const mockGetRefreshTokenByTokenHash = vi.fn();
  return { mockGetRefreshTokenByTokenHash };
});

vi.mock("@vassembly/client-encoder", () => ({
  hash: mockHash,
}));

vi.mock("../updateDb", () => ({
  updateRefreshToken: mockUpdateRefreshToken,
}));

vi.mock("../../queries", () => ({
  getRefreshTokenByTokenHash: mockGetRefreshTokenByTokenHash,
}));

import { revokeRefreshToken } from "./index";
import { NotFoundError } from "@vassembly/errors";

describe("revokeRefreshToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should revoke an existing refresh token", async () => {
    const tokenString = "refresh-token-string";
    const tokenHash = "hashed-token";
    const tokenId = "token-id-123";

    mockHash.mockReturnValue(tokenHash);
    mockGetRefreshTokenByTokenHash.mockResolvedValue({
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

    const result = await revokeRefreshToken({
      refreshToken: tokenString,
    });

    expect(result.data.id).toBe(tokenId);
    expect(result.data.revokedAt).toBeDefined();
  });

  it("should throw NotFoundError when token does not exist", async () => {
    const tokenString = "non-existent-token";
    const tokenHash = "hashed-token";

    mockHash.mockReturnValue(tokenHash);
    mockGetRefreshTokenByTokenHash.mockResolvedValue({
      data: { id: undefined },
    });

    await expect(
      revokeRefreshToken({ refreshToken: tokenString })
    ).rejects.toThrow(
      new NotFoundError("Refresh token not found")
    );
  });
});
