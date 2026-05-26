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

const { mockGetModelById } = vi.hoisted(() => {
  const mockGetModelById = vi.fn();
  return { mockGetModelById };
});

vi.mock("@vassembly/domain-auth-token", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@vassembly/domain-auth-token")>();
  return {
    ...actual,
    queries: {
      verify: mockVerifyAuthToken,
    },
    commands: {
      create: mockCreateAuthToken,
    },
  };
});

vi.mock("@vassembly/domain-refresh-token", () => ({
  commands: {
    refresh: mockRefreshRefreshToken,
  },
}));

vi.mock("@vassembly/domain-user", () => {
  const impl = {
    queries: {
      getModelById: mockGetModelById,
    },
  };
  return { ...impl, default: impl };
});

import { AUTH_TOKEN_ROLE } from "@vassembly/constants";

import { auth } from "./index";

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const input = {
    authToken: "valid-auth-token",
    refreshToken: "existing-refresh-token",
  };

  const mockVerifiedToken = {
    userId: "user-id-123",
    role: AUTH_TOKEN_ROLE.USER,
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

  it("should verify token, load user, rotate tokens, and return public user", async () => {
    mockVerifyAuthToken.mockResolvedValue(mockVerifiedToken);
    mockGetModelById.mockResolvedValue({
      data: { ...mockUserRecord, role: AUTH_TOKEN_ROLE.USER },
    });
    mockRefreshRefreshToken.mockResolvedValue(mockNewRefreshToken);
    mockCreateAuthToken.mockResolvedValue({ token: "new-auth-token-value" });

    const result = await auth(input);

    expect(result.authToken).toBe("new-auth-token-value");
    expect(result.refreshToken).toBe("new-refresh-token-value");
    expect(result.user).toEqual({
      id: "user-id-123",
      email: "user@example.com",
      firstName: "Jane",
      lastName: "Doe",
      verifiedAt: "2024-01-15T12:00:00.000Z",
      role: AUTH_TOKEN_ROLE.USER,
    });
  });

  it("should create auth token with current database role instead of stale jwt role", async () => {
    mockVerifyAuthToken.mockResolvedValue({
      ...mockVerifiedToken,
      role: AUTH_TOKEN_ROLE.USER,
    });
    mockGetModelById.mockResolvedValue({
      data: { ...mockUserRecord, role: AUTH_TOKEN_ROLE.ADMIN },
    });
    mockRefreshRefreshToken.mockResolvedValue(mockNewRefreshToken);
    mockCreateAuthToken.mockResolvedValue({ token: "new-auth-token-value" });

    const result = await auth(input);

    expect(mockCreateAuthToken).toHaveBeenCalledWith({
      input: {
        userId: mockVerifiedToken.userId,
        refreshTokenId: mockNewRefreshToken.id,
        role: AUTH_TOKEN_ROLE.ADMIN,
      },
    });
    expect(result.user.role).toBe(AUTH_TOKEN_ROLE.ADMIN);
  });

  it("should default auth token role to user when database role is undefined", async () => {
    mockVerifyAuthToken.mockResolvedValue({
      ...mockVerifiedToken,
      role: AUTH_TOKEN_ROLE.ADMIN,
    });
    mockGetModelById.mockResolvedValue({
      data: mockUserRecord,
    });
    mockRefreshRefreshToken.mockResolvedValue(mockNewRefreshToken);
    mockCreateAuthToken.mockResolvedValue({ token: "new-auth-token-value" });

    await auth(input);

    expect(mockCreateAuthToken).toHaveBeenCalledWith({
      input: {
        userId: mockVerifiedToken.userId,
        refreshTokenId: mockNewRefreshToken.id,
        role: AUTH_TOKEN_ROLE.USER,
      },
    });
  });

  it("should throw error when auth token verification fails", async () => {
    const error = new Error("Invalid token");
    mockVerifyAuthToken.mockRejectedValue(error);

    await expect(auth(input)).rejects.toThrow("Invalid token");
  });

  it("should throw error when verified token has no userId", async () => {
    mockVerifyAuthToken.mockResolvedValue({
      userId: undefined,
      role: AUTH_TOKEN_ROLE.USER,
      refreshTokenId: "old-refresh-token-id",
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    await expect(auth(input)).rejects.toThrow("Failed to verify auth token");
  });

  it("should throw NotFoundError when user is removed", async () => {
    mockVerifyAuthToken.mockResolvedValue(mockVerifiedToken);
    mockGetModelById.mockResolvedValue({
      data: { ...mockUserRecord, removedAt: new Date() },
    });

    await expect(auth(input)).rejects.toThrow("User not found");
  });

  it("should throw error when refresh token command fails", async () => {
    const error = new Error("Refresh token not found");
    mockVerifyAuthToken.mockResolvedValue(mockVerifiedToken);
    mockGetModelById.mockResolvedValue({
      data: { ...mockUserRecord, role: AUTH_TOKEN_ROLE.USER },
    });
    mockRefreshRefreshToken.mockRejectedValue(error);

    await expect(auth(input)).rejects.toThrow("Refresh token not found");
  });
});
