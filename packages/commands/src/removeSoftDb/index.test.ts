import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Model } from "@vassembly/model";
import { WrongParamError } from "@vassembly/errors";
import { removeSoftDb } from "./index";
import type { CommonDbCommandGeneratorParams } from "../types";
import type { MongoDbDAOType } from "@vassembly/client-mongodb";

interface TestModel extends Model {
  id: string;
  name: string;
  email: string;
  removedAt?: Date;
}

type MockTestInstance = Partial<TestModel> & {
  isValid: ReturnType<typeof vi.fn>;
};

const createMockInstance = (data: Partial<TestModel>): MockTestInstance => {
  const instance = {
    ...data,
    isValid: vi.fn(() => ({ success: true as const, data: data as TestModel })),
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
    dao: mockDao as unknown as MongoDbDAOType<TestModel>,
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

      const queryInstance = createMockInstance({ id } as TestModel);
      const updateInstance = {
        removedAt,
        isValid: vi.fn(),
      };
      const getQueryInstance = createMockInstance({ id } as TestModel);
      const finalInstance = createMockInstance(updatedInstance);

      mockFactory.create
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(updateInstance as Partial<TestModel>)
        .mockReturnValueOnce(getQueryInstance)
        .mockReturnValueOnce(finalInstance);
      mockDao.update.mockResolvedValueOnce(updatedInstance);
      mockDao.get.mockResolvedValueOnce(updatedInstance);

      const handler = removeSoftDb(params);
      const result = await handler({ id });

      expect(result).toEqual({ data: finalInstance });
      expect(mockDao.update).toHaveBeenCalledOnce();
    });
  });

  describe("error handling", () => {
    it("should throw WrongParamError when id is missing", async () => {
      const queryInstance = {
        id: "",
        isValid: vi.fn().mockImplementation(() => {
          throw new WrongParamError("Id is missing or invalid");
        }),
      };

      mockFactory.create.mockReturnValueOnce(queryInstance as Partial<TestModel>);

      const handler = removeSoftDb(params);

      await expect(handler({ id: "" })).rejects.toThrow(WrongParamError);
    });

    it("should propagate dao errors", async () => {
      const id = "test-id-123";
      const queryInstance = createMockInstance({ id } as TestModel);
      const updateInstance = {
        removedAt: new Date(),
        isValid: vi.fn(),
      };
      const daoError = new Error("Database connection failed");

      mockFactory.create
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(updateInstance as Partial<TestModel>);
      mockDao.update.mockRejectedValueOnce(daoError);

      const handler = removeSoftDb(params);

      await expect(handler({ id })).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("validation schema", () => {
    it("should always call isValid for id since VALIDATION_SCHEMA is built-in", async () => {
      const id = "test-id-123";
      const removedAt = new Date();
      const updatedInstance = {
        id,
        name: "John Doe",
        email: "john@example.com",
        removedAt,
      };
      const queryInstance = {
        id,
        isValid: vi.fn(),
      };
      const updateInstance = {
        removedAt,
        isValid: vi.fn(),
      };

      mockFactory.create
        .mockReturnValueOnce(queryInstance as Partial<TestModel>)
        .mockReturnValueOnce(updateInstance as Partial<TestModel>)
        .mockReturnValueOnce(createMockInstance(updatedInstance));
      mockDao.update.mockResolvedValueOnce(updatedInstance);
      mockDao.get.mockResolvedValueOnce(updatedInstance);

      const handler = removeSoftDb(params);
      await handler({ id });

      expect(queryInstance.isValid).toHaveBeenCalledWith({ shouldThrow: true });
    });

    it("should propagate validation errors when isValid throws", async () => {
      const id = "test-id-123";
      const validationError = new Error("Invalid id format");
      const queryInstance = {
        id,
        isValid: vi.fn().mockImplementation(() => {
          throw validationError;
        }),
      };

      mockFactory.create.mockReturnValueOnce(queryInstance as Partial<TestModel>);

      const handler = removeSoftDb(params);

      const promise = handler({ id });
      await expect(promise).rejects.toThrow("Invalid id format");
    });
  });
});
