import { decode } from "./index";
import { create } from "../../commands/create";
import type { DecodeAuthTokenInput } from "./types";
import { describe, it, expect } from "vitest";

describe("decodeAuthToken", () => {
  it("should decode auth token without verification", async () => {
      const createResult = await create({
      input: {
        role: "user",
        userId: "user-789",
        refreshTokenId: "jwt-101",
      },
    });

    const decodeInput: DecodeAuthTokenInput = {
      token: createResult.token as string,
    };

    const result = await decode(decodeInput);

    expect(result).not.toBeNull();
    expect(result?.role).toBe("user");
    expect(result?.userId).toBe("user-789");
    expect(result?.refreshTokenId).toBe("jwt-101");
  });

  it("should return null for invalid token", async () => {
    const decodeInput: DecodeAuthTokenInput = {
      token: "invalid-token",
    };

    const result = await decode(decodeInput);

    expect(result).toBeNull();
  });
});
