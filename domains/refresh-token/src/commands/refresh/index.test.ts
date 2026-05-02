import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock MongoDB connection before importing any modules that use it
vi.mock("@vassembly/client-mongodb/src/connection.js", () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

vi.mock("@vassembly/client-encoder", () => ({
  encode: vi.fn(),
  randomString: vi.fn(),
}));

vi.mock("../../queries");
vi.mock("../create");
vi.mock("../updateDb");

const { mockGetRefreshTokenByTokenHash, mockCreateRefreshToken, mockUpdateRefreshToken } = vi.hoisted(() => {
  const mockGetRefreshTokenByTokenHash = vi.fn();
  const mockCreateRefreshToken = vi.fn();
  const mockUpdateRefreshToken = vi.fn();
  return { mockGetRefreshTokenByTokenHash, mockCreateRefreshToken, mockUpdateRefreshToken };
});

vi.mock("../../queries/getByTokenHash", () => ({
  getByTokenHash: mockGetRefreshTokenByTokenHash,
}));

vi.mock("../create", () => ({
  create: mockCreateRefreshToken,
}));

vi.mock("../updateDb", () => ({
  update: mockUpdateRefreshToken,
}));

import { refresh } from "./index";
import { encode } from "@vassembly/client-encoder";
import { WrongParamError, NotFoundError } from "@vassembly/errors";

describe("refreshRefreshToken", () => {
  const mockEncode = vi.mocked(encode);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should refresh an active token", async () => {
    mockEncode.mockReturnValue("token-hash");
    
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    mockGetRefreshTokenByTokenHash.mockResolvedValue({
      data: {
        id: "old-token-id",
        userId: "user-123",
        tokenHash: "token-hash",
        expiresAt,
        revokedAt: null,
      },
    });

    mockCreateRefreshToken.mockResolvedValue({
      id: "new-token-id",
      userId: "user-123",
      tokenHash: "new-token-hash",
      token: "new-token-string",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      revokedAt: null,
    });

    mockUpdateRefreshToken.mockResolvedValue({
      data: {
        id: "old-token-id",
        replacedByRefreshTokenId: "new-token-id",
      },
    });

    const result = await refresh({ refreshToken: "token-string" });

    expect(result.id).toBe("new-token-id");
    expect(result.userId).toBe("user-123");
    expect(result.token).toBe("new-token-string");
  });

  it("should throw NotFoundError when token does not exist", async () => {
    mockEncode.mockReturnValue("token-hash");
    mockGetRefreshTokenByTokenHash.mockResolvedValue({
      data: { id: undefined },
    });

    await expect(
      refresh({ refreshToken: "token-string" })
    ).rejects.toThrow(
      new NotFoundError("Refresh token not found")
    );
  });

  it("should throw WrongParamError when token is revoked", async () => {
    mockEncode.mockReturnValue("token-hash");
    mockGetRefreshTokenByTokenHash.mockResolvedValue({
      data: {
        id: "old-token-id",
        userId: "user-123",
        tokenHash: "token-hash",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        revokedAt: new Date(),
      },
    });

    await expect(
      refresh({ refreshToken: "token-string" })
    ).rejects.toThrow(
      new WrongParamError("Refresh token is revoked")
    );
  });

  it("should throw WrongParamError when token is expired beyond grace period", async () => {
    mockEncode.mockReturnValue("token-hash");

    mockGetRefreshTokenByTokenHash.mockResolvedValue({
      data: {
        id: "old-token-id",
        userId: "user-123",
        tokenHash: "token-hash",
        expiresAt: new Date(Date.now() - 1000 * 60),
        revokedAt: null,
      },
    });

    await expect(
      refresh({ refreshToken: "token-string" })
    ).rejects.toThrow(
      new WrongParamError("Refresh token is expired")
    );
  });

  it("should accept token within grace period", async () => {
    mockEncode.mockReturnValue("token-hash");

    const expiresAt = new Date(Date.now() - 15 * 1000);
    mockGetRefreshTokenByTokenHash.mockResolvedValue({
      data: {
        id: "old-token-id",
        userId: "user-123",
        tokenHash: "token-hash",
        expiresAt,
        revokedAt: null,
      },
    });

    mockCreateRefreshToken.mockResolvedValue({
      id: "new-token-id",
      userId: "user-123",
      tokenHash: "new-token-hash",
      token: "new-token-string",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      revokedAt: null,
    });

    mockUpdateRefreshToken.mockResolvedValue({
      data: {
        id: "old-token-id",
        replacedByRefreshTokenId: "new-token-id",
      },
    });

    const result = await refresh({ refreshToken: "token-string" });

    expect(result.id).toBe("new-token-id");
  });
});
