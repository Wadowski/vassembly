import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/domain-auth-token");
vi.mock("@vassembly/domain-refresh-token");

const { mockVerifyAuthToken } = vi.hoisted(() => {
  const mockVerifyAuthToken = vi.fn();
  return { mockVerifyAuthToken };
});

const { mockRefreshRefreshToken } = vi.hoisted(() => {
  const mockRefreshRefreshToken = vi.fn();
  return { mockRefreshRefreshToken };
});

vi.mock("@vassembly/domain-auth-token", () => ({
  default: {
    queries: {
      verify: mockVerifyAuthToken,
    },
  },
}));

vi.mock("@vassembly/domain-refresh-token", () => ({
  default: {
    commands: {
      refresh: mockRefreshRefreshToken,
    },
  },
}));

import { auth } from "./index";

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully verify auth token and refresh refresh token", async () => {
    const input = {
      authToken: "valid-auth-token",
      refreshToken: "existing-refresh-token",
    };

    const mockVerifiedToken = {
      userId: "user-id-123",
      role: "user",
      refreshTokenId: "old-refresh-token-id",
      expiresAt: new Date(),
      createdAt: new Date(),
    };

    const mockNewRefreshToken = {
      id: "new-refresh-token-id",
      token: "new-refresh-token-value",
    };

    mockVerifyAuthToken.mockResolvedValue(mockVerifiedToken);
    mockRefreshRefreshToken.mockResolvedValue(mockNewRefreshToken);

    const result = await auth(input);

    expect(result.authToken).toEqual(mockVerifiedToken);
    expect(result.refreshToken).toBe("new-refresh-token-value");
  });

  it("should throw error when auth token verification fails", async () => {
    const input = {
      authToken: "invalid-auth-token",
      refreshToken: "existing-refresh-token",
    };

    const error = new Error("Invalid token");
    mockVerifyAuthToken.mockRejectedValue(error);

    await expect(auth(input)).rejects.toThrow("Invalid token");
  });

  it("should throw error when verified token has no userId", async () => {
    const input = {
      authToken: "valid-auth-token",
      refreshToken: "existing-refresh-token",
    };

    const mockVerifiedToken = {
      userId: undefined,
      role: "user",
      refreshTokenId: "old-refresh-token-id",
      expiresAt: new Date(),
      createdAt: new Date(),
    };

    mockVerifyAuthToken.mockResolvedValue(mockVerifiedToken);

    await expect(auth(input)).rejects.toThrow("Failed to verify auth token");
  });

  it("should throw error when refresh token command fails", async () => {
    const input = {
      authToken: "valid-auth-token",
      refreshToken: "existing-refresh-token",
    };

    const mockVerifiedToken = {
      userId: "user-id-123",
      role: "user",
      refreshTokenId: "old-refresh-token-id",
      expiresAt: new Date(),
      createdAt: new Date(),
    };

    const error = new Error("Refresh token not found");
    mockVerifyAuthToken.mockResolvedValue(mockVerifiedToken);
    mockRefreshRefreshToken.mockRejectedValue(error);

    await expect(auth(input)).rejects.toThrow("Refresh token not found");
  });
});
