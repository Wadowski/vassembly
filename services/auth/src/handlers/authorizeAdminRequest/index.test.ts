import { describe, it, expect, vi, beforeEach } from "vitest";

import * as authTokenDomain from "@vassembly/domain-auth-token";
import { ForbiddenError, UnauthorizedError } from "@vassembly/errors";

import { authorizeAdminRequest } from ".";

vi.mock("@vassembly/domain-auth-token");

describe("authorizeAdminRequest", () => {
  const mockHeaders = {
    authorization: "Bearer valid-token",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns userId and admin role when token has admin role", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: "admin-123",
      role: "admin",
      refreshTokenId: "refresh-123",
    } as never);

    const result = await authorizeAdminRequest({ headers: mockHeaders });

    expect(result).toEqual({ userId: "admin-123", role: "admin" });
  });

  it("throws ForbiddenError when token has user role", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: "user-123",
      role: "user",
      refreshTokenId: "refresh-123",
    } as never);

    await expect(authorizeAdminRequest({ headers: mockHeaders })).rejects.toThrow(
      new ForbiddenError("Admin access required"),
    );
  });

  it("throws ForbiddenError when token has no role claim", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: "user-123",
      refreshTokenId: "refresh-123",
    } as never);

    await expect(authorizeAdminRequest({ headers: mockHeaders })).rejects.toThrow(
      new ForbiddenError("Admin access required"),
    );
  });

  it("throws UnauthorizedError when token is invalid", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockRejectedValue(
      new UnauthorizedError("Authentication required"),
    );

    await expect(authorizeAdminRequest({ headers: mockHeaders })).rejects.toThrow(
      new UnauthorizedError("Authentication required"),
    );
  });
});
