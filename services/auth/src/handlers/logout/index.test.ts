import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockVerifyAuthToken } = vi.hoisted(() => {
  const mockVerifyAuthToken = vi.fn();
  return { mockVerifyAuthToken };
});

const { mockRevokeRefreshToken } = vi.hoisted(() => {
  const mockRevokeRefreshToken = vi.fn();
  return { mockRevokeRefreshToken };
});

vi.mock("@vassembly/domain-auth-token", () => ({
  queries: {
    verify: mockVerifyAuthToken,
  },
}));

vi.mock("@vassembly/domain-refresh-token", () => ({
  commands: {
    revoke: mockRevokeRefreshToken,
  },
}));

import { logout } from "./index";

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should verify token and revoke refresh token", async () => {
    const authToken = "valid-auth-token";
    const refreshToken = "valid-refresh-token";

    mockVerifyAuthToken.mockResolvedValue({
      userId: "user-123",
      refreshTokenId: "refresh-id-456",
      role: "user",
    });

    mockRevokeRefreshToken.mockResolvedValue({
      id: "refresh-id-456",
      revokedAt: new Date().toISOString(),
    });

    const result = await logout({ authToken, refreshToken });

    expect(mockVerifyAuthToken).toHaveBeenCalledWith({ token: authToken });
    expect(mockRevokeRefreshToken).toHaveBeenCalledWith({ refreshToken });
    expect(result).toEqual({ ok: true });
  });

  it("should throw error when auth token verification fails", async () => {
    const authToken = "invalid-auth-token";
    const refreshToken = "valid-refresh-token";

    mockVerifyAuthToken.mockResolvedValue({
      userId: undefined,
      refreshTokenId: "refresh-id-456",
    });

    await expect(
      logout({ authToken, refreshToken })
    ).rejects.toThrow("Failed to verify auth token");

    expect(mockRevokeRefreshToken).not.toHaveBeenCalled();
  });

  it("should throw error when refresh token revoke fails", async () => {
    const authToken = "valid-auth-token";
    const refreshToken = "invalid-refresh-token";

    mockVerifyAuthToken.mockResolvedValue({
      userId: "user-123",
      refreshTokenId: "refresh-id-456",
      role: "user",
    });

    mockRevokeRefreshToken.mockRejectedValue(
      new Error("Refresh token not found")
    );

    await expect(
      logout({ authToken, refreshToken })
    ).rejects.toThrow("Refresh token not found");
  });
});
