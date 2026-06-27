import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockGetListForUser, mockCompleteOnboarding } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockGetListForUser: vi.fn(),
  mockCompleteOnboarding: vi.fn(),
}));

vi.mock("@vassembly/domain-user", () => {
  const impl = {
    commands: {
      completeOnboarding: mockCompleteOnboarding,
    },
  };
  return { ...impl, default: impl };
});

vi.mock("@vassembly/domain-ai-integration", () => {
  const impl = {
    queries: {
      getListForUser: mockGetListForUser,
    },
  };
  return { ...impl, default: impl };
});

vi.mock("../getUser", () => ({
  getUser: mockGetUser,
}));

import { checkAndCompleteOnboarding } from "./index";

const VALID_USER_ID = "507f1f77bcf86cd799439011";

describe("checkAndCompleteOnboarding handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompleteOnboarding.mockResolvedValue(undefined);
    mockGetListForUser.mockResolvedValue({ totalCount: 0, items: [], page: 1, size: 1 });
  });

  it("should complete onboarding when email is verified and user has active credentials", async () => {
    mockGetUser.mockResolvedValue({
      user: {
        id: VALID_USER_ID,
        verifiedAt: new Date(),
        onboarding: {
          version: 1,
          startedAt: new Date(),
          completedAt: null,
        },
      },
    });
    mockGetListForUser.mockResolvedValue({ totalCount: 1, items: [{}], page: 1, size: 1 });

    await expect(checkAndCompleteOnboarding({ userId: VALID_USER_ID })).resolves.toBeUndefined();

    expect(mockCompleteOnboarding).toHaveBeenCalledWith({ userId: VALID_USER_ID });
  });

  it("should return early when onboarding is already complete", async () => {
    mockGetUser.mockResolvedValue({
      user: {
        id: VALID_USER_ID,
        verifiedAt: new Date(),
        onboarding: {
          version: 1,
          completedAt: new Date(),
        },
      },
    });

    await expect(checkAndCompleteOnboarding({ userId: VALID_USER_ID })).resolves.toBeUndefined();

    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
    expect(mockGetListForUser).not.toHaveBeenCalled();
  });

  it("should return early when user is grandfathered without onboarding field", async () => {
    mockGetUser.mockResolvedValue({
      user: {
        id: VALID_USER_ID,
        verifiedAt: new Date(),
      },
    });

    await expect(checkAndCompleteOnboarding({ userId: VALID_USER_ID })).resolves.toBeUndefined();

    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
    expect(mockGetListForUser).not.toHaveBeenCalled();
  });

  it("should return early when email is not verified", async () => {
    mockGetUser.mockResolvedValue({
      user: {
        id: VALID_USER_ID,
        verifiedAt: null,
        onboarding: {
          version: 1,
          completedAt: null,
        },
      },
    });

    await expect(checkAndCompleteOnboarding({ userId: VALID_USER_ID })).resolves.toBeUndefined();

    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
    expect(mockGetListForUser).not.toHaveBeenCalled();
  });

  it("should return early when user has no active AI credentials", async () => {
    mockGetUser.mockResolvedValue({
      user: {
        id: VALID_USER_ID,
        verifiedAt: new Date(),
        onboarding: {
          version: 1,
          completedAt: null,
        },
      },
    });
    mockGetListForUser.mockResolvedValue({ totalCount: 0, items: [], page: 1, size: 1 });

    await expect(checkAndCompleteOnboarding({ userId: VALID_USER_ID })).resolves.toBeUndefined();

    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });
});
