import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/client-mongodb/src/connection.js", () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGet, mockUpdate } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("../../clients", () => ({
  userMongodbDao: {
    get: mockGet,
    update: mockUpdate,
  },
}));

import { initiateOnboarding } from "./index";
import { NotFoundError, WrongParamError } from "@vassembly/errors";

const VALID_USER_ID = "507f1f77bcf86cd799439011";

describe("initiateOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set onboarding startedAt, completedAt null, and version when user exists", async () => {
    mockGet.mockResolvedValue({ id: VALID_USER_ID, email: "u@example.com" });
    mockUpdate.mockResolvedValue(undefined);

    await expect(initiateOnboarding({ userId: VALID_USER_ID })).resolves.toBeUndefined();

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const updatePayload = mockUpdate.mock.calls[0]?.[1];
    expect(updatePayload.onboarding).toMatchObject({
      version: 1,
      completedAt: null,
    });
    expect(updatePayload.onboarding.startedAt).toBeInstanceOf(Date);
  });

  it("should be a no-op when onboarding is already started", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      email: "u@example.com",
      onboarding: {
        version: 1,
        startedAt: new Date("2026-01-01T00:00:00.000Z"),
        completedAt: null,
      },
    });

    await expect(initiateOnboarding({ userId: VALID_USER_ID })).resolves.toBeUndefined();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when user is not found", async () => {
    mockGet.mockResolvedValue(null);

    await expect(initiateOnboarding({ userId: VALID_USER_ID })).rejects.toThrow(NotFoundError);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should throw WrongParamError when user id is invalid", async () => {
    await expect(initiateOnboarding({ userId: "not-an-object-id" })).rejects.toThrow(
      WrongParamError,
    );
    expect(mockGet).not.toHaveBeenCalled();
  });
});
