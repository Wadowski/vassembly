import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/domain-user");

const { mockUpdate } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
}));

vi.mock("@vassembly/domain-user", () => {
  const impl = {
    commands: {
      update: mockUpdate,
    },
    queries: {},
  };
  return { ...impl, default: impl };
});

import { NotFoundError, WrongParamError } from "@vassembly/errors";

import { updateUserProfile } from "./index";

describe("updateUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns updated user when update succeeds", async () => {
    const user = { 
      id: "u1", 
      firstName: "John", 
      lastName: "Doe",
      createdAt: new Date(),
      updatedAt: new Date(),
      removedAt: undefined,
      email: "john@example.com",
      verifiedAt: undefined,
    };
    mockUpdate.mockResolvedValueOnce({ data: user });

    const result = await updateUserProfile({
      userId: "u1",
      firstName: "John",
      lastName: "Doe",
    });

    expect(result.user).toEqual({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      removedAt: user.removedAt,
      email: user.email,
      verifiedAt: user.verifiedAt,
    });
  });

  it("throws when neither firstName nor lastName is provided", async () => {
    await expect(
      updateUserProfile({
        userId: "u1",
        firstName: undefined,
        lastName: undefined,
      }),
    ).rejects.toThrow(WrongParamError);
  });

  it("throws when the user does not exist after update", async () => {
    mockUpdate.mockResolvedValueOnce({ data: undefined });

    await expect(
      updateUserProfile({
        userId: "u1",
        firstName: "John",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
