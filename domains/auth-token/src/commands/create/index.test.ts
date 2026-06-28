import { describe, it, expect, vi } from "vitest";

vi.mock("@vassembly/config", () => ({
  config: {
    jwt: {
      secret: "test-secret-key-for-onboarding-claims",
    },
  },
}));

vi.mock("../../model", () => ({
  authTokenFactory: {
    create: (data: Record<string, unknown>) => ({ ...data }),
  },
}));

import { create } from "./index";
import type { CreateAuthTokenArgs } from "./types";

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const payload = token.split(".")[1];
  if (!payload) {
    throw new Error("Missing JWT payload segment");
  }
  return JSON.parse(Buffer.from(payload, "base64url").toString()) as Record<string, unknown>;
};

describe("createAuthToken", () => {
  it("should create auth token with provided input", async () => {
    const input: CreateAuthTokenArgs = {
      input: {
        role: "admin",
        userId: "user-123",
        refreshTokenId: "refresh-token-456",
      },
    };

    const result = await create(input);

    expect(result.token).toBeDefined();
    expect(result.role).toBe("admin");
    expect(result.userId).toBe("user-123");
    expect(result.refreshTokenId).toBe("refresh-token-456");
  });

  it("should include onb false claim when onboardingCompleted is false", async () => {
    const input: CreateAuthTokenArgs = {
      input: {
        role: "user",
        userId: "user-123",
        refreshTokenId: "refresh-token-456",
        onboardingCompleted: false,
      },
    };

    const result = await create(input);
    const payload = decodeJwtPayload(result.token as string);

    expect(payload.onb).toBe(false);
  });

  it("should include onb true claim when onboardingCompleted is true", async () => {
    const input: CreateAuthTokenArgs = {
      input: {
        role: "user",
        userId: "user-123",
        refreshTokenId: "refresh-token-456",
        onboardingCompleted: true,
      },
    };

    const result = await create(input);
    const payload = decodeJwtPayload(result.token as string);

    expect(payload.onb).toBe(true);
  });

  it("should default onb claim to true when onboardingCompleted is absent", async () => {
    const input: CreateAuthTokenArgs = {
      input: {
        role: "user",
        userId: "user-123",
        refreshTokenId: "refresh-token-456",
      },
    };

    const result = await create(input);
    const payload = decodeJwtPayload(result.token as string);

    expect(payload.onb).toBe(true);
  });
});
