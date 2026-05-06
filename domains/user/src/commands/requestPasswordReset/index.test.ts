import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/client-mongodb/src/connection.js", () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGet, mockUpdate, mockEncode } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
  mockEncode: vi.fn(),
}));

vi.mock("@vassembly/client-encoder", () => ({
  encode: mockEncode,
}));

vi.mock("../../clients", () => ({
  userMongodbDao: {
    get: mockGet,
    update: mockUpdate,
  },
}));

import { requestPasswordReset } from "./index";
import { NotFoundError, WrongParamError } from "@vassembly/errors";

const VALID_USER_ID = "507f1f77bcf86cd799439011";

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should store encoded token and expiry when user exists", async () => {
    mockGet.mockResolvedValue({ id: VALID_USER_ID, email: "u@example.com" });
    mockEncode.mockReturnValue("encoded-token");
    mockUpdate.mockResolvedValue(undefined);

    await expect(
      requestPasswordReset({ userId: VALID_USER_ID, token: "plain-secret" }),
    ).resolves.toBeUndefined();

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockEncode).toHaveBeenCalledWith("plain-secret");
  });

  it("should throw NotFoundError when user is not found", async () => {
    mockGet.mockResolvedValue(null);

    await expect(
      requestPasswordReset({ userId: VALID_USER_ID, token: "plain-secret" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw WrongParamError when user id is invalid", async () => {
    await expect(
      requestPasswordReset({ userId: "not-an-object-id", token: "plain-secret" }),
    ).rejects.toThrow(WrongParamError);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("should throw WrongParamError when token is missing", async () => {
    await expect(
      requestPasswordReset({ userId: VALID_USER_ID, token: "" }),
    ).rejects.toThrow(WrongParamError);
    expect(mockGet).not.toHaveBeenCalled();
  });
});
