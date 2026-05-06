import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/domain-user");

const { mockChangePassword } = vi.hoisted(() => ({
  mockChangePassword: vi.fn(),
}));

vi.mock("@vassembly/domain-user", () => {
  const impl = {
    commands: {
      changePassword: mockChangePassword,
    },
    queries: {},
  };
  return { ...impl, default: impl };
});

import { UnauthorizedError, ValidationError } from "@vassembly/errors";

import { changePassword } from "./index";

describe("changePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when the password is changed", async () => {
    mockChangePassword.mockResolvedValueOnce({ data: {} });

    const result = await changePassword({
      userId: "u1",
      currentPassword: "old",
      newPassword: "new-password-1",
    });

    expect(result.success).toBe(true);
  });

  it("maps an incorrect current password to ValidationError", async () => {
    mockChangePassword.mockRejectedValueOnce(new UnauthorizedError("Current password is incorrect"));

    await expect(
      changePassword({
        userId: "u1",
        currentPassword: "wrong",
        newPassword: "new-password-1",
      }),
    ).rejects.toThrow(ValidationError);
  });
});
