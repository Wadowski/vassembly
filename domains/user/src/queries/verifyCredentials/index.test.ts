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
vi.mock("../../model");
vi.mock("../getListQuery");

const { mockCompareHash } = vi.hoisted(() => {
  const mockCompareHash = vi.fn();
  return { mockCompareHash };
});

const { mockGetListUsersByQuery } = vi.hoisted(() => {
  const mockGetListUsersByQuery = vi.fn();
  return { mockGetListUsersByQuery };
});

vi.mock("@vassembly/client-encoder", () => ({
  compareHash: mockCompareHash,
}));

vi.mock("../getListQuery", () => ({
  getListByQuery: mockGetListUsersByQuery,
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

    const mockUser = {
      id: "user-id-123",
      email: input.email,
      passwordHash: "hashed-password",
      firstName: "John",
      lastName: "Doe",
    } as unknown as UserModel;

    mockGetListUsersByQuery.mockResolvedValue({
      data: [mockUser],
    });

    mockCompareHash.mockResolvedValue(true);

    const result = await verify(input);

    expect(result).toEqual(mockUser);
    expect(result.id).toBe("user-id-123");
    expect(mockGetListUsersByQuery).toHaveBeenCalledWith({
      email: input.email,
      limit: 1,
    });
    expect(mockCompareHash).toHaveBeenCalledWith({
      text: input.password,
      hash: mockUser.passwordHash,
    });
  });

  it("should throw UnauthorizedError when user does not exist", async () => {
    const input = {
      email: "nonexistent@example.com",
      password: "ValidPassword123!",
    };

    mockGetListUsersByQuery.mockResolvedValue({
      data: [],
    });

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

    mockGetListUsersByQuery.mockResolvedValue({
      data: [mockUser],
    });

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

    mockGetListUsersByQuery.mockResolvedValue({
      data: [mockUserWithoutHash],
    });

    await expect(verify(input)).rejects.toThrow(UnauthorizedError);
    await expect(verify(input)).rejects.toThrow(
      "Invalid email or password"
    );
    expect(mockCompareHash).not.toHaveBeenCalled();
  });
});
