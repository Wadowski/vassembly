import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./createDb");
vi.mock("@vassembly/client-encoder");

const { mockCreateRefreshTokenDb } = vi.hoisted(() => {
  const mockCreateRefreshTokenDb = vi.fn();
  return { mockCreateRefreshTokenDb };
});

const { mockRandomString, mockEncode } = vi.hoisted(() => {
  const mockRandomString = vi.fn();
  const mockEncode = vi.fn();
  return { mockRandomString, mockEncode };
});

vi.mock("./createDb", () => ({
  createRefreshTokenDb: mockCreateRefreshTokenDb,
}));

vi.mock("@vassembly/client-encoder", () => ({
  randomString: mockRandomString,
  encode: mockEncode,
}));

import { create } from "./index";
import type { RefreshTokenModel } from "../../model";

describe("createRefreshToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a refresh token successfully", async () => {
    const mockToken = "random-token-string-36-characters";
    const mockTokenHash = "hashed-token-value";
    const mockUserId = "user-123";

    mockRandomString.mockReturnValue(mockToken);
    mockEncode.mockReturnValue(mockTokenHash);

    const mockExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const mockCreatedToken: RefreshTokenModel = {
      id: "token-id-123",
      userId: mockUserId,
      tokenHash: mockTokenHash,
      token: mockToken,
      expiresAt: mockExpiresAt,
      revokedAt: null,
    };

    mockCreateRefreshTokenDb.mockResolvedValue({
      data: mockCreatedToken,
    });

    const result = await create({
      userId: mockUserId,
    });

    expect(result.id).toBe("token-id-123");
    expect(result.userId).toBe(mockUserId);
    expect(result.token).toBe(mockToken);
    expect(result.tokenHash).toBe(mockTokenHash);
  });

  it("should create a refresh token with optional description", async () => {
    const mockToken = "random-token-string-36-characters";
    const mockTokenHash = "hashed-token-value";
    const mockUserId = "user-456";
    const description = "API Token for Mobile App";

    mockRandomString.mockReturnValue(mockToken);
    mockEncode.mockReturnValue(mockTokenHash);

    const mockExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const mockCreatedToken: RefreshTokenModel = {
      id: "token-id-456",
      userId: mockUserId,
      tokenHash: mockTokenHash,
      token: mockToken,
      description,
      expiresAt: mockExpiresAt,
      revokedAt: null,
    };

    mockCreateRefreshTokenDb.mockResolvedValue({
      data: mockCreatedToken,
    });

    const result = await create({
      userId: mockUserId,
      description,
    });

    expect(result.description).toBe(description);
    expect(result.id).toBe("token-id-456");
  });
});
