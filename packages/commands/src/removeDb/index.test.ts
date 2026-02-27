import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Model } from "@vassembly/model";
import { WrongParamError } from "@vassembly/errors";
import { removeDb } from "./index";
import type { CommonDbCommandGeneratorParams } from "../types";
import { MongoDbDAO } from "@vassembly/client-mongodb";

interface TestModel extends Model {
  id: string;
  name: string;
  email: string;
}

describe("removeDb", () => {
  const mockFactory = {
    create: vi.fn(),
    createMany: vi.fn(),
  };

  const mockDao = {
    remove: vi.fn(),
  };

  const params: CommonDbCommandGeneratorParams<TestModel> = {
    factory: mockFactory,
    dao: mockDao as unknown as MongoDbDAO<TestModel>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful removal", () => {
    it("should remove item and return success when id is valid", async () => {
      const id = "test-id-123";
      const queryInstance = { id };

      mockFactory.create.mockReturnValueOnce(queryInstance as Partial<TestModel>);
      mockDao.remove.mockResolvedValueOnce(undefined);

      const handler = removeDb(params);
      const result = await handler({ id });

      expect(result).toEqual({ success: true });
      expect(mockFactory.create).toHaveBeenCalledWith({ id });
      expect(mockDao.delete).toHaveBeenCalledWith(queryInstance);
    });

    it("should handle removal of multiple different items", async () => {
      const id1 = "test-id-456";
      const id2 = "test-id-789";
      const queryInstance1 = { id: id1 };
      const queryInstance2 = { id: id2 };

      mockFactory.create
        .mockReturnValueOnce(queryInstance1 as Partial<TestModel>)
        .mockReturnValueOnce(queryInstance2 as Partial<TestModel>);
      mockDao.remove
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const handler = removeDb(params);
      const result1 = await handler({ id: id1 });
      const result2 = await handler({ id: id2 });

      expect(result1).toEqual({ success: true });
      expect(result2).toEqual({ success: true });
      expect(mockDao.remove).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should throw WrongParamError when id is missing", async () => {
      const handler = removeDb(params);

      await expect(handler({ id: "" })).rejects.toThrow(WrongParamError);
    });

    it("should propagate dao errors", async () => {
      const id = "test-id-123";
      const queryInstance = { id };
      const daoError = new Error("Database connection failed");

      mockFactory.create.mockReturnValueOnce(queryInstance as Partial<TestModel>);
      mockDao.remove.mockRejectedValueOnce(daoError);

      const handler = removeDb(params);

      await expect(handler({ id })).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
