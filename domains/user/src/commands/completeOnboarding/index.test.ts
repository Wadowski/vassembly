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

import { completeOnboarding } from "./index";
import { NotFoundError, WrongParamError } from "@vassembly/errors";

const VALID_USER_ID = "507f1f77bcf86cd799439011";

describe("completeOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set onboarding completedAt when onboarding is in progress", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      email: "u@example.com",
      onboarding: {
        version: 1,
        startedAt: new Date("2026-01-01T00:00:00.000Z"),
        completedAt: null,
      },
    });
    mockUpdate.mockResolvedValue(undefined);

    await expect(completeOnboarding({ userId: VALID_USER_ID })).resolves.toBeUndefined();

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const updatePayload = mockUpdate.mock.calls[0]?.[1];
    expect(updatePayload.onboarding.completedAt).toBeInstanceOf(Date);
  });

  it("should no-op when onboarding is already complete", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      email: "u@example.com",
      onboarding: {
        version: 1,
        startedAt: new Date("2026-01-01T00:00:00.000Z"),
        completedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
    });

    await expect(completeOnboarding({ userId: VALID_USER_ID })).resolves.toBeUndefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should throw WrongParamError when onboarding was never initiated", async () => {
    mockGet.mockResolvedValue({
      id: VALID_USER_ID,
      email: "u@example.com",
    });

    await expect(completeOnboarding({ userId: VALID_USER_ID })).rejects.toThrow(WrongParamError);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when user is not found", async () => {
    mockGet.mockResolvedValue(null);

    await expect(completeOnboarding({ userId: VALID_USER_ID })).rejects.toThrow(NotFoundError);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should throw WrongParamError when user id is invalid", async () => {
    await expect(completeOnboarding({ userId: "not-an-object-id" })).rejects.toThrow(
      WrongParamError,
    );
    expect(mockGet).not.toHaveBeenCalled();
  });
});
