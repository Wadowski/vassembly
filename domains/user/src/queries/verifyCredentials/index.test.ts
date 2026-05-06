import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/client-mongodb/src/connection.js", () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

vi.mock("@vassembly/client-encoder");
vi.mock("../../clients");

const { mockCompareHash } = vi.hoisted(() => {
  const mockCompareHash = vi.fn();
  return { mockCompareHash };
});

const { mockGetByEmail } = vi.hoisted(() => {
  const mockGetByEmail = vi.fn();
  return { mockGetByEmail };
});

vi.mock("@vassembly/client-encoder", () => ({
  compareHash: mockCompareHash,
}));

vi.mock("../getByEmail", () => ({
  getByEmail: mockGetByEmail,
}));

import { verify } from "./index";
import { UnauthorizedError } from "@vassembly/errors";
import type { UserModel } from "../../model";

describe("verifyCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user when credentials are valid", async () => {
    const input = {
      email: "user@example.com",
      password: "ValidPassword123!",
    };

    const passwordHash = "hashed-password";
    const mockUser = {
      id: "user-id-123",
      email: input.email,
      passwordHash,
      firstName: "John",
      lastName: "Doe",
    } as unknown as UserModel;

    mockGetByEmail.mockResolvedValue(mockUser);

    mockCompareHash.mockResolvedValue(true);

    const result = await verify(input);

    expect("passwordHash" in result).toBe(false);
    expect(result.id).toBe("user-id-123");
    expect(mockGetByEmail).toHaveBeenCalledWith({
      email: input.email,
      includePasswordHash: true,
    });
    expect(mockCompareHash).toHaveBeenCalledWith({
      text: input.password,
      hash: passwordHash,
    });
  });

  it("should throw UnauthorizedError when user does not exist", async () => {
    const input = {
      email: "nonexistent@example.com",
      password: "ValidPassword123!",
    };

    mockGetByEmail.mockResolvedValue(null);

    await expect(verify(input)).rejects.toThrow(UnauthorizedError);
    await expect(verify(input)).rejects.toThrow(
      "Invalid email or password"
    );
    expect(mockCompareHash).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when password is invalid", async () => {
    const input = {
      email: "user@example.com",
      password: "WrongPassword123!",
    };

    const mockUser = {
      id: "user-id-123",
      email: input.email,
      passwordHash: "hashed-password",
      firstName: "John",
      lastName: "Doe",
    } as unknown as UserModel;

    mockGetByEmail.mockResolvedValue(mockUser);

    mockCompareHash.mockResolvedValue(false);

    await expect(verify(input)).rejects.toThrow(UnauthorizedError);
    await expect(verify(input)).rejects.toThrow(
      "Invalid email or password"
    );
    expect(mockCompareHash).toHaveBeenCalledWith({
      text: input.password,
      hash: mockUser.passwordHash,
    });
  });

  it("should throw UnauthorizedError when user has no password hash", async () => {
    const input = {
      email: "user@example.com",
      password: "ValidPassword123!",
    };

    const mockUserWithoutHash = {
      id: "user-id-123",
      email: input.email,
      passwordHash: undefined,
      firstName: "John",
      lastName: "Doe",
    } as unknown as UserModel;

    mockGetByEmail.mockResolvedValue(mockUserWithoutHash);

    await expect(verify(input)).rejects.toThrow(UnauthorizedError);
    await expect(verify(input)).rejects.toThrow(
      "Invalid email or password"
    );
    expect(mockCompareHash).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when user is removed", async () => {
    const input = {
      email: "user@example.com",
      password: "ValidPassword123!",
    };

    const mockUser = {
      id: "user-id-123",
      email: input.email,
      passwordHash: "hashed-password",
      firstName: "John",
      lastName: "Doe",
      removedAt: new Date(),
    } as unknown as UserModel;

    mockGetByEmail.mockResolvedValue(mockUser);

    await expect(verify(input)).rejects.toThrow(UnauthorizedError);
    expect(mockCompareHash).not.toHaveBeenCalled();
  });
});

