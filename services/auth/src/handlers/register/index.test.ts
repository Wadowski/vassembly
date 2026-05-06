import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/domain-user");

const { mockCreateUser } = vi.hoisted(() => {
  const mockCreateUser = vi.fn();
  return { mockCreateUser };
});

vi.mock("@vassembly/domain-user", () => ({
  default: {
    commands: {
      create: mockCreateUser,
    },
  },
}));

import { register } from "./index";
import type { RegisterInput } from "./types";

describe("register", () => {
  const validInput: RegisterInput = {
    email: "user@example.com",
    password: "SecurePass123",
    firstName: "John",
    lastName: "Doe",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user data on successful registration", async () => {
    const userData = {
      id: "123",
      email: "user@example.com",
      firstName: "John",
      lastName: "Doe",
      createdAt: new Date(),
      updatedAt: new Date(),
      removedAt: undefined,
      verifiedAt: undefined,
    };

    mockCreateUser.mockResolvedValue({
      data: userData,
    });

    const result = await register(validInput);

    expect(result.user).toEqual({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      removedAt: userData.removedAt,
      verifiedAt: userData.verifiedAt,
    });
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
