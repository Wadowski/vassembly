import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/domain-user");
vi.mock("@vassembly/domain-refresh-token");
vi.mock("@vassembly/domain-auth-token");

const { mockVerifyCredentials } = vi.hoisted(() => {
  const mockVerifyCredentials = vi.fn();
  return { mockVerifyCredentials };
});

const { mockCreateRefreshToken } = vi.hoisted(() => {
  const mockCreateRefreshToken = vi.fn();
  return { mockCreateRefreshToken };
});

const { mockCreateAuthToken } = vi.hoisted(() => {
  const mockCreateAuthToken = vi.fn();
  return { mockCreateAuthToken };
});

vi.mock("@vassembly/domain-user", () => {
  const impl = {
    queries: {
      verify: mockVerifyCredentials,
    },
  };
  return { ...impl, default: impl };
});

vi.mock("@vassembly/domain-refresh-token", () => {
  const impl = {
    commands: {
      create: mockCreateRefreshToken,
    },
  };
  return { ...impl, default: impl };
});

vi.mock("@vassembly/domain-auth-token", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@vassembly/domain-auth-token")>();
  return {
    ...actual,
    commands: {
      create: mockCreateAuthToken,
    },
  };
});

import { AUTH_TOKEN_ROLE } from "@vassembly/constants";

import { login } from "./index";

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const input = {
    email: "user@example.com",
    password: "password123",
  };

  const mockUser = {
    id: "user-id-123",
    email: input.email,
    firstName: "John",
    lastName: "Doe",
  };

  const mockRefreshToken = {
    id: "refresh-token-id-456",
    token: "refresh-token-value",
  };

  const setupSuccessfulLoginMocks = (role?: AUTH_TOKEN_ROLE): void => {
    mockVerifyCredentials.mockResolvedValue({
      ...mockUser,
      ...(role === undefined ? {} : { role }),
    });
    mockCreateRefreshToken.mockResolvedValue(mockRefreshToken);
    mockCreateAuthToken.mockResolvedValue({ token: "auth-token-value" });
  };

  it("should create auth token with admin role from database", async () => {
    setupSuccessfulLoginMocks(AUTH_TOKEN_ROLE.ADMIN);

    await login(input);

    expect(mockCreateAuthToken).toHaveBeenCalledWith({
      input: {
        userId: mockUser.id,
        refreshTokenId: mockRefreshToken.id,
        role: AUTH_TOKEN_ROLE.ADMIN,
      },
    });
  });

  it("should create auth token with user role from database", async () => {
    setupSuccessfulLoginMocks(AUTH_TOKEN_ROLE.USER);

    await login(input);

    expect(mockCreateAuthToken).toHaveBeenCalledWith({
      input: {
        userId: mockUser.id,
        refreshTokenId: mockRefreshToken.id,
        role: AUTH_TOKEN_ROLE.USER,
      },
    });
  });

  it("should default auth token role to user when database role is undefined", async () => {
    setupSuccessfulLoginMocks(undefined);

    await login(input);

    expect(mockCreateAuthToken).toHaveBeenCalledWith({
      input: {
        userId: mockUser.id,
        refreshTokenId: mockRefreshToken.id,
        role: AUTH_TOKEN_ROLE.USER,
      },
    });
  });

  it("should successfully log in user and return tokens", async () => {
    setupSuccessfulLoginMocks(AUTH_TOKEN_ROLE.USER);

    const result = await login(input);

    expect(result.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      role: AUTH_TOKEN_ROLE.USER,
      createdAt: undefined,
      updatedAt: undefined,
      removedAt: undefined,
      verifiedAt: undefined,
    });
    expect(result.authToken).toBe("auth-token-value");
    expect(result.refreshToken).toBe("refresh-token-value");

    expect(mockVerifyCredentials).toHaveBeenCalledWith({
      email: input.email,
      password: input.password,
    });

    expect(mockCreateRefreshToken).toHaveBeenCalledWith({
      userId: mockUser.id,
    });
  });

  it("should throw error when credentials are invalid", async () => {
    const error = new Error("Invalid credentials");
    mockVerifyCredentials.mockRejectedValue(error);

    await expect(login(input)).rejects.toThrow("Invalid credentials");

    expect(mockCreateRefreshToken).not.toHaveBeenCalled();
    expect(mockCreateAuthToken).not.toHaveBeenCalled();
  });

  it("should throw error when refresh token creation fails", async () => {
    const error = new Error("Database error");
    mockVerifyCredentials.mockResolvedValue({ ...mockUser, role: AUTH_TOKEN_ROLE.USER });
    mockCreateRefreshToken.mockRejectedValue(error);

    await expect(login(input)).rejects.toThrow("Database error");

    expect(mockCreateAuthToken).not.toHaveBeenCalled();
  });

  it("should throw error when auth token creation fails", async () => {
    const error = new Error("Token creation failed");
    mockVerifyCredentials.mockResolvedValue({ ...mockUser, role: AUTH_TOKEN_ROLE.USER });
    mockCreateRefreshToken.mockResolvedValue(mockRefreshToken);
    mockCreateAuthToken.mockRejectedValue(error);

    await expect(login(input)).rejects.toThrow("Token creation failed");
  });
});
