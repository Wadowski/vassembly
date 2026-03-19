import { create } from "./index";
import type { CreateAuthTokenArgs } from "./types";
import { describe, it, expect } from "vitest";

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
});
