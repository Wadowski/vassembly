import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Model } from "@vassembly/model";
import { WrongParamError } from "@vassembly/errors";
import { removeSoftDb } from "./index";
import type { CommonDbCommandGeneratorParams } from "../types";
import { MongoDbDAO } from "@vassembly/client-mongodb";

interface TestModel extends Model {
  id: string;
  name: string;
  email: string;
  removedAt?: Date;
}

const createMockInstance = (data: Partial<TestModel>): any => {
  const instance = {
    ...data,
    isValid: vi.fn(() => ({ success: true, data })),
  };
  return instance;
};

describe("removeSoftDb", () => {
  const mockFactory = {
    create: vi.fn(),
    createMany: vi.fn(),
  };

  const mockDao = {
    update: vi.fn(),
    get: vi.fn(),
    getMany: vi.fn(),
  };

  const params: CommonDbCommandGeneratorParams<TestModel> = {
    factory: mockFactory,
    dao: mockDao as unknown as MongoDbDAO<TestModel>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful soft removal", () => {
    it("should set removedAt and return updated data when id is valid", async () => {
      const id = "test-id-123";
      const removedAt = new Date();
      const updatedInstance = {
        id,
        name: "John Doe",
        email: "john@example.com",
        removedAt,
      };

      const commandInstance = createMockInstance({ removedAt } as TestModel);
      const queryInstance = createMockInstance({ id } as TestModel);
      const finalInstance = createMockInstance(updatedInstance);

      mockFactory.create
        .mockReturnValueOnce(commandInstance)
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(finalInstance)
        .mockReturnValueOnce(finalInstance);
      mockDao.update.mockResolvedValueOnce(updatedInstance);
      mockDao.get.mockResolvedValueOnce(updatedInstance);

      const handler = removeSoftDb(params);
      const result = await handler({ id });

      expect(result).toEqual({ data: finalInstance });
      expect(mockFactory.create).toHaveBeenNthCalledWith(1, { removedAt: expect.any(Date) });
      expect(mockDao.update).toHaveBeenCalledOnce();
    });
  });

  describe("error handling", () => {
    it("should throw WrongParamError when id is missing", async () => {
      const handler = removeSoftDb(params);

      await expect(handler({ id: "" })).rejects.toThrow(WrongParamError);
    });

    it("should propagate dao errors", async () => {
      const id = "test-id-123";
      const updatedInstance = {
        id,
        name: "John Doe",
        email: "john@example.com",
      };
      const daoError = new Error("Database connection failed");

      mockFactory.create.mockReturnValueOnce(
        updatedInstance as Partial<TestModel>
      );
      mockDao.update.mockRejectedValueOnce(daoError);

      const handler = removeSoftDb(params);

      await expect(handler({ id })).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
