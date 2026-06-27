import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRefreshToken, mockCreateAuthToken, mockGetModelById } = vi.hoisted(() => {
  const mockRefreshToken = vi.fn();
  const mockCreateAuthToken = vi.fn();
  const mockGetModelById = vi.fn();
  return { mockRefreshToken, mockCreateAuthToken, mockGetModelById };
});

vi.mock("@vassembly/domain-refresh-token", () => ({
  commands: {
    refresh: mockRefreshToken,
  },
}));

vi.mock("@vassembly/domain-auth-token", () => ({
  commands: {
    create: mockCreateAuthToken,
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
    mockGetModelById.mockResolvedValue({ data: { id: "user-123", role: "user" } });
    mockCreateAuthToken.mockResolvedValue({ token: "new-auth-token" });
  });

  it("should refresh token successfully and return new token", async () => {
    const refreshToken = "valid-refresh-token";
    mockRefreshToken.mockResolvedValueOnce(mockNewToken);

    const result = await refresh({ refreshToken });

    expect(result).toEqual({
      authToken: "new-auth-token",
      refreshToken: "new-refresh-token-string",
    });
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
