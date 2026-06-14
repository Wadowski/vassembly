import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRefreshToken } = vi.hoisted(() => {
  const mockRefreshToken = vi.fn();
  return { mockRefreshToken };
});

vi.mock("@vassembly/domain-refresh-token", () => ({
  commands: {
    refresh: mockRefreshToken,
  },
}));

import { refresh } from "./index";

describe("refresh handler", () => {
  const mockNewToken = {
    id: "new-token-id",
    token: "new-refresh-token-string",
    userId: "user-123",
    expiresAt: new Date(),
    revokedAt: null,
    replacedByRefreshTokenId: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should refresh token successfully and return new token", async () => {
    const refreshToken = "valid-refresh-token";
    mockRefreshToken.mockResolvedValueOnce(mockNewToken);

    const result = await refresh({ refreshToken });

    expect(result).toEqual(mockNewToken);
  });

  it("should throw NotFoundError when token not found", async () => {
    const refreshToken = "invalid-token";
    const error = new Error("Refresh token not found");
    mockRefreshToken.mockRejectedValueOnce(error);

    await expect(refresh({ refreshToken })).rejects.toThrow(error);
  });

  it("should throw WrongParamError when token is revoked", async () => {
    const refreshToken = "revoked-token";
    const error = new Error("Refresh token is revoked");
    mockRefreshToken.mockRejectedValueOnce(error);

    await expect(refresh({ refreshToken })).rejects.toThrow(error);
  });

  it("should throw WrongParamError when token is expired", async () => {
    const refreshToken = "expired-token";
    const error = new Error("Refresh token is expired");
    mockRefreshToken.mockRejectedValueOnce(error);

    await expect(refresh({ refreshToken })).rejects.toThrow(error);
  });
});
