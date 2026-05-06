import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/client-mongodb/src/connection.js", () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

vi.mock("../../clients");
vi.mock("../../queries");

const { mockHash } = vi.hoisted(() => {
  const mockHash = vi.fn();
  return { mockHash };
});

const { mockGetByEmail } = vi.hoisted(() => {
  const mockGetByEmail = vi.fn();
  return { mockGetByEmail };
});

const { mockValidatePassword, mockCreateDbUser } = vi.hoisted(() => {
  const mockValidatePassword = vi.fn();
  const mockCreateDbUser = vi.fn();
  return { mockValidatePassword, mockCreateDbUser };
});

vi.mock("@vassembly/client-encoder", () => ({
  hash: mockHash,
}));

vi.mock("@vassembly/validation", () => ({
  validatorFactory: vi.fn(() => mockValidatePassword),
}));

vi.mock("@vassembly/commands", () => ({
  createDb: vi.fn(() => mockCreateDbUser),
}));

vi.mock("../../queries", () => ({
  getByEmail: mockGetByEmail,
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

    mockGetByEmail.mockResolvedValue(null);

    mockValidatePassword.mockResolvedValue({
      success: true,
    });

    const passwordHash = "hashed-password";
    mockHash.mockResolvedValue(passwordHash);

    const mockUser = {
      id: "user-id-123",
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    } as unknown as UserModel;

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

    mockGetByEmail.mockResolvedValue({ id: "existing-user-id", email: input.email } as UserModel);

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

    mockGetByEmail.mockResolvedValue(null);

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

    mockGetByEmail.mockResolvedValue(null);

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

    mockGetByEmail.mockResolvedValue(null);

    mockValidatePassword.mockResolvedValue({
      success: true,
    });

    const passwordHash = "hashed-password-value";
    mockHash.mockResolvedValue(passwordHash);

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

    expect("passwordHash" in result.data).toBe(false);
    expect(result.data.email).toBe(input.email);
  });

  it("should create when email belongs only to removed accounts (active lookup is empty)", async () => {
    const input = {
      email: "reuse@example.com",
      password: "ValidPass123!",
      firstName: "Re",
      lastName: "Use",
    };

    mockGetByEmail.mockResolvedValue(null);

    mockValidatePassword.mockResolvedValue({
      success: true,
    });

    mockHash.mockResolvedValue("hashed-password");

    mockCreateDbUser.mockResolvedValue({
      data: {
        id: "new-id-456",
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    const result = await create(input);

    expect(result.data.id).toBe("new-id-456");
    expect(result.data.email).toBe(input.email);
  });
});
