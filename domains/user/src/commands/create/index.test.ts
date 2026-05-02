import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/client-mongodb/src/connection.js", () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs");
vi.mock("../../clients");
vi.mock("../../model");
vi.mock("../../queries");

const { mockBcryptGenSalt, mockBcryptHash } = vi.hoisted(() => {
  const mockBcryptGenSalt = vi.fn();
  const mockBcryptHash = vi.fn();
  return { mockBcryptGenSalt, mockBcryptHash };
});

const { mockGetListUsersByQuery } = vi.hoisted(() => {
  const mockGetListUsersByQuery = vi.fn();
  return { mockGetListUsersByQuery };
});

const { mockValidatePassword, mockCreateDbUser } = vi.hoisted(() => {
  const mockValidatePassword = vi.fn();
  const mockCreateDbUser = vi.fn();
  return { mockValidatePassword, mockCreateDbUser };
});

vi.mock("bcryptjs", () => ({
  default: {
    genSalt: mockBcryptGenSalt,
    hash: mockBcryptHash,
  },
}));

vi.mock("@vassembly/validation", () => ({
  validatorFactory: vi.fn(() => mockValidatePassword),
}));

vi.mock("@vassembly/commands", () => ({
  createDb: vi.fn(() => mockCreateDbUser),
}));

vi.mock("../../queries", () => ({
  getListByQuery: mockGetListUsersByQuery,
}));

vi.mock("./constants");

import { create } from "./index";
import type { UserModel } from "../../model";
import { WrongParamError } from "@vassembly/errors";

describe("createUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a user with valid input", async () => {
    const input = {
      email: "user@example.com",
      password: "ValidPass123!",
      firstName: "John",
      lastName: "Doe",
    };

    mockGetListUsersByQuery.mockResolvedValue({
      data: [],
    });

    mockValidatePassword.mockResolvedValue({
      success: true,
    });

    const salt = "mock-salt";
    const passwordHash = "hashed-password";
    mockBcryptGenSalt.mockResolvedValue(salt);
    mockBcryptHash.mockResolvedValue(passwordHash);

    const mockUser: UserModel = {
      id: "user-id-123",
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    };

    mockCreateDbUser.mockResolvedValue({
      data: mockUser,
    });

    const result = await create(input);

    expect(result.data.id).toBe("user-id-123");
    expect(result.data.email).toBe(input.email);
    expect(result.data.firstName).toBe(input.firstName);
    expect(result.data.lastName).toBe(input.lastName);
  });

  it("should throw error if email already exists", async () => {
    const input = {
      email: "existing@example.com",
      password: "ValidPass123!",
      firstName: "Jane",
      lastName: "Doe",
    };

    mockGetListUsersByQuery.mockResolvedValue({
      data: [{ id: "existing-user-id", email: input.email }],
    });

    await expect(create(input)).rejects.toThrow(
      new WrongParamError("Email already exists")
    );
  });

  it("should throw error if password validation fails", async () => {
    const input = {
      email: "user@example.com",
      password: "weak",
      firstName: "John",
      lastName: "Doe",
    };

    mockGetListUsersByQuery.mockResolvedValue({
      data: [],
    });

    const validationError = new Error("Password must be at least 8 characters");
    mockValidatePassword.mockResolvedValue({
      success: false,
      error: validationError,
    });

    await expect(create(input)).rejects.toThrow(validationError);
  });

  it("should throw error if passwords do not match", async () => {
    const input = {
      email: "user@example.com",
      password: "ValidPass123!",
      firstName: "John",
      lastName: "Doe",
    };

    mockGetListUsersByQuery.mockResolvedValue({
      data: [],
    });

    const validationError = new Error("Passwords do not match");
    mockValidatePassword.mockResolvedValue({
      success: false,
      error: validationError,
    });

    await expect(create(input)).rejects.toThrow(validationError);
  });

  it("should create user with hashed password", async () => {
    const input = {
      email: "user@example.com",
      password: "ValidPass123!",
      firstName: "John",
      lastName: "Doe",
    };

    mockGetListUsersByQuery.mockResolvedValue({
      data: [],
    });

    mockValidatePassword.mockResolvedValue({
      success: true,
    });

    const passwordHash = "hashed-password-value";
    mockBcryptGenSalt.mockResolvedValue("salt");
    mockBcryptHash.mockResolvedValue(passwordHash);

    mockCreateDbUser.mockResolvedValue({
      data: {
        id: "user-id-123",
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    const result = await create(input);

    expect(result.data.passwordHash).toBe(passwordHash);
    expect(result.data.email).toBe(input.email);
  });
});
