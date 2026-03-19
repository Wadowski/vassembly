import { verifyAuthToken } from "./index";
import { createAuthToken } from "../../commands/create";
import type { VerifyAuthTokenInput } from "./types";
import { describe, it, expect } from "vitest";

describe("verifyAuthToken", () => {
  it("should verify and decode auth token", async () => {
    const createResult = await createAuthToken({
      input: {
        role: "admin",
        userId: "user-123",
        refreshTokenId: "jwt-456",
      },
    });

    const verifyInput: VerifyAuthTokenInput = {
      token: createResult.token as string,
    };

    const result = await verifyAuthToken(verifyInput);

    expect(result.role).toBe("admin");
    expect(result.userId).toBe("user-123");
    expect(result.refreshTokenId).toBe("jwt-456");
    expect(result.expiresAt).toBeDefined();
    expect(result.createdAt).toBeDefined();
  });
});
