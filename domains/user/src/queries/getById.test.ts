import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vassembly/client-mongodb/src/connection.js", () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock("../clients", () => ({
  userMongodbDao: {
    get: mockGet,
  },
}));

import { NotFoundError } from "@vassembly/errors";

import { getById } from "./getById";

const VALID_ID = "507f1f77bcf86cd799439011";

describe("getById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw NotFoundError when user is soft-deleted", async () => {
    mockGet.mockResolvedValue({
      _id: VALID_ID,
      id: VALID_ID,
      email: "x@y.com",
      removedAt: new Date(),
    });

    await expect(getById({ id: VALID_ID })).rejects.toThrow(NotFoundError);
  });
});
