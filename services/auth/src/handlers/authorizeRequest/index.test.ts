import { describe, it, expect, vi, beforeEach } from "vitest";

import * as authTokenDomain from "@vassembly/domain-auth-token";
import { UnauthorizedError } from "@vassembly/errors";

import { authorizeRequest } from ".";

vi.mock("@vassembly/domain-auth-token");

describe("authorizeRequest", () => {
  const mockHeaders = {
    authorization: "Bearer valid-token",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns userId when token is valid", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: "user-123",
      role: "user",
      refreshTokenId: "refresh-123",
    } as never);

    const result = await authorizeRequest({ headers: mockHeaders });

    expect(result).toEqual({ userId: "user-123", role: "user", onboardingCompleted: false });
    expect(authTokenDomain.queries.verify).toHaveBeenCalledWith({
      token: "valid-token",
    });
  });

  it("extracts token from CUSTOM_HEADERS.AuthToken header", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: "user-123",
      role: "user",
      refreshTokenId: "refresh-123",
    } as never);

    const headers = { "x-auth-token": "custom-header-token" };
    await authorizeRequest({ headers });

    expect(authTokenDomain.queries.verify).toHaveBeenCalledWith({
      token: "custom-header-token",
    });
  });

  it("throws UnauthorizedError when no token provided", async () => {
    const headers = {};

    await expect(authorizeRequest({ headers })).rejects.toThrow(
      new UnauthorizedError("Authentication required"),
    );
  });

  it("throws UnauthorizedError when token is empty string", async () => {
    const headers = { authorization: "Bearer " };

    await expect(authorizeRequest({ headers })).rejects.toThrow(
      new UnauthorizedError("Authentication required"),
    );
  });

  it("throws UnauthorizedError when verified token has no userId", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: undefined,
      role: "user",
      refreshTokenId: "refresh-123",
    } as never);

    await expect(authorizeRequest({ headers: mockHeaders })).rejects.toThrow(
      new UnauthorizedError("Authentication required"),
    );
  });

  it("returns onboardingCompleted true when token marks onboarding complete", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: "user-123",
      role: "user",
      refreshTokenId: "refresh-123",
      onboardingCompleted: true,
    } as never);

    const result = await authorizeRequest({ headers: mockHeaders });

    expect(result).toEqual({ userId: "user-123", role: "user", onboardingCompleted: true });
  });

  it("returns onboardingCompleted false when token marks onboarding incomplete", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: "user-123",
      role: "user",
      refreshTokenId: "refresh-123",
      onboardingCompleted: false,
    } as never);

    const result = await authorizeRequest({ headers: mockHeaders });

    expect(result).toEqual({ userId: "user-123", role: "user", onboardingCompleted: false });
  });

  it("defaults role to user when role claim is missing", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: "user-123",
      refreshTokenId: "refresh-123",
    } as never);

    const result = await authorizeRequest({ headers: mockHeaders });

    expect(result).toEqual({ userId: "user-123", role: "user", onboardingCompleted: false });
  });

  it("trims whitespace from tokens", async () => {
    vi.mocked(authTokenDomain.queries.verify).mockResolvedValue({
      userId: "user-123",
      role: "user",
      refreshTokenId: "refresh-123",
    } as never);

    const headers = { authorization: "Bearer   valid-token   " };
    await authorizeRequest({ headers });

    expect(authTokenDomain.queries.verify).toHaveBeenCalledWith({
      token: "valid-token",
    });
  });
});
