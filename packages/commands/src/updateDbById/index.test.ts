import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Model } from "@vassembly/model";
import { WrongParamError } from "@vassembly/errors";
import { updateDbById } from ".";
import type { CommonDbCommandGeneratorParams } from "../types";
import { MongoDbDAO } from "@vassembly/client-mongodb";

interface TestModel extends Model {
  id: string;
  name: string;
  email: string;
}

const createMockInstance = (data: Partial<TestModel>): any => {
  const instance = {
    ...data,
    isValid: vi.fn(() => ({ success: true, data })),
  };
  return instance;
};

describe("updateDbById", () => {
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

  describe("successful update", () => {
    it("should update and return data when instance is valid", async () => {
      const id = "test-id-123";
      const inputData = {
        name: "John Doe Updated",
        email: "john.updated@example.com",
      };
      const updatedInstance = {
        id,
        name: "John Doe Updated",
        email: "john.updated@example.com",
      };

      const commandInstance = createMockInstance({ ...inputData, id } as TestModel);
      const queryInstance = createMockInstance({ id } as TestModel);
      const finalInstance = createMockInstance(updatedInstance);

      mockFactory.create
        .mockReturnValueOnce(commandInstance)
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(finalInstance)
        .mockReturnValueOnce(updatedInstance);
      mockDao.update.mockResolvedValueOnce(updatedInstance);
      mockDao.get.mockResolvedValueOnce(updatedInstance);

      const handler = updateDbById(params);
      const result = await handler({ id, data: updatedInstance });

      expect(result).toEqual({ data: updatedInstance });
    });

    it("should handle instances with additional properties", async () => {
      const id = "test-id-456";
      const inputData = {
        name: "Jane Smith Updated",
        email: "jane.updated@example.com",
      };
      const updatedInstance = {
        id,
        name: "Jane Smith Updated",
        email: "jane.updated@example.com",
      };

      const commandInstance = createMockInstance({ ...inputData, id } as TestModel);
      const queryInstance = createMockInstance({ id } as TestModel);
      const finalInstance = createMockInstance(updatedInstance);

      mockFactory.create
        .mockReturnValueOnce(commandInstance)
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(finalInstance)
        .mockReturnValueOnce(updatedInstance);
      mockDao.update.mockResolvedValueOnce(updatedInstance);
      mockDao.get.mockResolvedValueOnce(updatedInstance);

      const handler = updateDbById(params);
      const result = await handler({ id, data: inputData });

      expect(result).toEqual({ data: updatedInstance });
      expect(mockDao.update).toHaveBeenCalledOnce();
    });
  });

  describe("error handling", () => {
    it("should throw WrongParamError when id is missing", async () => {
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const handler = updateDbById(params);

      const promise = handler({ id: "", data: inputData });
      await expect(promise).rejects.toThrow(WrongParamError);
      await expect(promise).rejects.toThrow("Id is missing or invalid");
      expect(mockDao.update).not.toHaveBeenCalled();
    });

    it("should throw WrongParamError when id is undefined", async () => {
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const handler = updateDbById(params);

      const promise = handler({ id: "", data: inputData });
      await expect(promise).rejects.toThrow(WrongParamError);
      expect(mockDao.update).not.toHaveBeenCalled();
    });

    it("should propagate dao errors", async () => {
      const id = "test-id-789";
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };
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
      mockDao.get.mockResolvedValueOnce(updatedInstance);

      const handler = updateDbById(params);

      await expect(handler({ id, data: inputData })).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
