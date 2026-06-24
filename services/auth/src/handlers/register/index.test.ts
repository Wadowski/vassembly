import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/domain-user");
vi.mock("@vassembly/domain-refresh-token");
vi.mock("@vassembly/domain-auth-token");

const { mockCreateUser } = vi.hoisted(() => {
  const mockCreateUser = vi.fn();
  return { mockCreateUser };
});

const { mockCreateRefreshToken } = vi.hoisted(() => {
  const mockCreateRefreshToken = vi.fn();
  return { mockCreateRefreshToken };
});

const { mockCreateAuthToken } = vi.hoisted(() => {
  const mockCreateAuthToken = vi.fn();
  return { mockCreateAuthToken };
});

vi.mock("@vassembly/domain-user", () => ({
  default: {
    commands: {
      create: mockCreateUser,
    },
  },
}));

vi.mock("@vassembly/domain-refresh-token", () => {
  const impl = {
    commands: {
      create: mockCreateRefreshToken,
    },
  };
  return { ...impl, default: impl };
});

vi.mock("@vassembly/domain-auth-token", () => {
  const impl = {
    commands: {
      create: mockCreateAuthToken,
    },
  };
  return { ...impl, default: impl };
});

import { AUTH_TOKEN_ROLE } from "@vassembly/constants";

import { register } from "./index";
import type { RegisterInput } from "./types";

describe("register", () => {
  const validInput: RegisterInput = {
    email: "user@example.com",
    password: "SecurePass123",
    firstName: "John",
    lastName: "Doe",
  };

  const userData = {
    id: "123",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    role: AUTH_TOKEN_ROLE.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    removedAt: undefined,
    verifiedAt: undefined,
  };

  const mockRefreshToken = {
    id: "refresh-token-id-456",
    token: "refresh-token-value",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateUser.mockResolvedValue({ data: userData });
    mockCreateRefreshToken.mockResolvedValue(mockRefreshToken);
    mockCreateAuthToken.mockResolvedValue({ token: "auth-token-value" });
  });

  it("should return user data and tokens on successful registration", async () => {
    const result = await register(validInput);

    expect(result.user).toEqual({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      removedAt: userData.removedAt,
      verifiedAt: userData.verifiedAt,
    });
    expect(result.authToken).toBe("auth-token-value");
    expect(result.refreshToken).toBe("refresh-token-value");
  });

  it("should throw error when email already exists", async () => {
    const error = new Error("Email already exists");
    mockCreateUser.mockRejectedValue(error);

    await expect(register(validInput)).rejects.toThrow("Email already exists");
  });

  it("should throw error when password validation fails", async () => {
    const error = new Error("Passwords do not match");
    mockCreateUser.mockRejectedValue(error);

    await expect(register(validInput)).rejects.toThrow(
      "Passwords do not match"
    );
  });

  it("should throw error when database creation fails", async () => {
    const error = new Error("Database error");
    mockCreateUser.mockRejectedValue(error);

    await expect(register(validInput)).rejects.toThrow("Database error");
  });
});
