import { describe, it, expect, vi, beforeEach } from "vitest";
const { mockVerifyAuthToken } = vi.hoisted(() => {
  const mockVerifyAuthToken = vi.fn();
  return { mockVerifyAuthToken };
});

const { mockRefreshRefreshToken } = vi.hoisted(() => {
  const mockRefreshRefreshToken = vi.fn();
  return { mockRefreshRefreshToken };
});

const { mockCreateAuthToken } = vi.hoisted(() => {
  const mockCreateAuthToken = vi.fn();
  return { mockCreateAuthToken };
});

const { mockGetUserById } = vi.hoisted(() => {
  const mockGetUserById = vi.fn();
  return { mockGetUserById };
});

vi.mock("@vassembly/domain-auth-token", () => ({
  queries: {
    verify: mockVerifyAuthToken,
  },
  commands: {
    create: mockCreateAuthToken,
  },
}));

vi.mock("@vassembly/domain-refresh-token", () => ({
  commands: {
    refresh: mockRefreshRefreshToken,
  },
}));

vi.mock("@vassembly/domain-user", () => ({
  queries: {
    getById: mockGetUserById,
  },
}));

import { auth } from "./index";

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should verify token, load user, rotate tokens, and return public user", async () => {
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

    const mockUserRecord = {
      id: "user-id-123",
      email: "user@example.com",
      firstName: "Jane",
      lastName: "Doe",
      verifiedAt: new Date("2024-01-15T12:00:00.000Z"),
    };

    mockVerifyAuthToken.mockResolvedValue(mockVerifiedToken);
    mockGetUserById.mockResolvedValue({ data: mockUserRecord });
    mockRefreshRefreshToken.mockResolvedValue(mockNewRefreshToken);
    mockCreateAuthToken.mockResolvedValue({ token: "new-auth-token-value" });

    const result = await auth(input);

    expect(result.authToken).toBe("new-auth-token-value");
    expect(result.refreshToken).toBe("new-refresh-token-value");
    expect(result.data).toEqual(mockVerifiedToken);
    expect(result.user).toEqual({
      id: "user-id-123",
      email: "user@example.com",
      firstName: "Jane",
      lastName: "Doe",
      verifiedAt: "2024-01-15T12:00:00.000Z",
    });
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

  it("should throw NotFoundError when user is not found", async () => {
    const input = {
      authToken: "valid-auth-token",
      refreshToken: "existing-refresh-token",
    };

    const mockVerifiedToken = {
      userId: "missing-user-id",
      role: "user",
      refreshTokenId: "old-refresh-token-id",
      expiresAt: new Date(),
      createdAt: new Date(),
    };

    mockVerifyAuthToken.mockResolvedValue(mockVerifiedToken);
    mockGetUserById.mockResolvedValue({ data: undefined });

    await expect(auth(input)).rejects.toThrow("User not found");
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

    const mockUserRecord = {
      id: "user-id-123",
      email: "user@example.com",
    };

    const error = new Error("Refresh token not found");
    mockVerifyAuthToken.mockResolvedValue(mockVerifiedToken);
    mockGetUserById.mockResolvedValue({ data: mockUserRecord });
    mockRefreshRefreshToken.mockRejectedValue(error);

    await expect(auth(input)).rejects.toThrow("Refresh token not found");
  });
});
