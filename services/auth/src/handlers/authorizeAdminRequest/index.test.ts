import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAssertHasRole } = vi.hoisted(() => ({
  mockAssertHasRole: vi.fn(),
}));

vi.mock("@vassembly/domain-auth-token");
vi.mock("@vassembly/domain-user", () => ({
  default: {
    queries: {
      assertHasRole: mockAssertHasRole,
    },
  },
}));

import * as authTokenDomain from "@vassembly/domain-auth-token";
import { AUTH_TOKEN_ROLE } from "@vassembly/constants";
import { ForbiddenError, UnauthorizedError } from "@vassembly/errors";

import { authorizeAdminRequest } from ".";

describe("authorizeAdminRequest", () => {
  const mockHeaders = {
    authorization: "Bearer valid-token",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns userId and admin role when assertHasRole succeeds", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: "admin-123",
      role: "user",
      refreshTokenId: "refresh-123",
    } as never);
    mockAssertHasRole.mockResolvedValue(undefined);

    const result = await authorizeAdminRequest({ headers: mockHeaders });

    expect(result).toEqual({ userId: "admin-123", role: AUTH_TOKEN_ROLE.ADMIN });
    expect(mockAssertHasRole).toHaveBeenCalledWith({
      userId: "admin-123",
      role: AUTH_TOKEN_ROLE.ADMIN,
    });
  });

  it("throws ForbiddenError when assertHasRole rejects admin access", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: "user-123",
      role: "admin",
      refreshTokenId: "refresh-123",
    } as never);
    mockAssertHasRole.mockRejectedValue(
      new ForbiddenError("Admin access required"),
    );

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

    expect(mockAssertHasRole).not.toHaveBeenCalled();
  });
});
