import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Model } from "@vassembly/model";
import { z } from "zod";
import { createDb } from "./index";
import type { CommonDbCommandGeneratorParams } from "../types";
import type { MongoDbDAOType } from "@vassembly/client-mongodb";

interface TestModel extends Model {
  id: string;
  name: string;
  email: string;
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

describe("createDb", () => {
  const mockFactory = {
    create: vi.fn(),
    createMany: vi.fn(),
  };

  const mockDao = {
    create: vi.fn(),
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

  describe("successful creation", () => {
    it("should create and return data when instance is valid", async () => {
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };
      const createdInstance = {
        id: "test-id-123",
        name: "John Doe",
        email: "john@example.com",
      };
      const daoResponse = { ...createdInstance };

      const commandInstance = createMockInstance(inputData as TestModel);
      const queryInstance = createMockInstance({ id: createdInstance.id } as TestModel);
      const finalInstance = createMockInstance(createdInstance);

      mockFactory.create
        .mockReturnValueOnce(commandInstance)
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(finalInstance);
      mockDao.create.mockResolvedValueOnce(daoResponse.id);
      mockDao.get.mockResolvedValueOnce(daoResponse);

      const handler = createDb(params);
      const result = await handler({ ...inputData });

      expect(result).toEqual({ data: finalInstance });
    });

    it("should handle instances with additional properties", async () => {
      const inputData = {
        name: "Jane Smith",
        email: "jane@example.com",
      };
      const createdInstance = {
        id: "test-id-456",
        name: "Jane Smith",
        email: "jane@example.com",
      };
      const daoResponse = { ...createdInstance };

      const commandInstance = createMockInstance(inputData as TestModel);
      const queryInstance = createMockInstance({ id: createdInstance.id } as TestModel);
      const finalInstance = createMockInstance(createdInstance);

      mockFactory.create
        .mockReturnValueOnce(commandInstance)
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(finalInstance);
      mockDao.create.mockResolvedValueOnce(daoResponse.id);
      mockDao.get.mockResolvedValueOnce(daoResponse);

      const handler = createDb(params);
      const result = await handler({ ...inputData });

      expect(result).toEqual({ data: finalInstance });
      expect(mockDao.create).toHaveBeenCalledOnce();
    });
  });

  describe("error handling", () => {
    it("should propagate dao errors", async () => {
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };
      const daoError = new Error("Database connection failed");

      const commandInstance = createMockInstance(inputData as TestModel);
      mockFactory.create.mockReturnValueOnce(commandInstance);
      mockDao.create.mockRejectedValueOnce(daoError);

      const handler = createDb(params);

      await expect(handler({ ...inputData })).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should throw WrongParamError when dao.create returns falsy value", async () => {
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const commandInstance = createMockInstance(inputData as TestModel);
      mockFactory.create.mockReturnValueOnce(commandInstance);
      mockDao.create.mockResolvedValueOnce(null);

      const handler = createDb(params);

      await expect(handler({ ...inputData })).rejects.toThrow(
        "command :: createDb :: Failed to create instance"
      );
    });
  });

  describe("validationSchema field", () => {
    it("should not call isValid when validationSchema is not provided", async () => {
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };
      const createdInstance = {
        id: "test-id-123",
        name: "John Doe",
        email: "john@example.com",
      };

      const commandInstance = {
        ...inputData,
        isValid: vi.fn(),
      };
      const queryInstance = createMockInstance({ id: createdInstance.id } as TestModel);
      const finalInstance = createMockInstance(createdInstance);

      mockFactory.create
        .mockReturnValueOnce(commandInstance)
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(finalInstance);
      mockDao.create.mockResolvedValueOnce(createdInstance.id);
      mockDao.get.mockResolvedValueOnce(createdInstance);

      const handler = createDb(params);
      await handler({ ...inputData });

      expect(commandInstance.isValid).not.toHaveBeenCalled();
    });

    it("should propagate validation errors when isValid throws", async () => {
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };
      const validationSchema = { validate: vi.fn() } as unknown as z.ZodSchema;
      const validationError = new Error("Invalid input data");

      const commandInstance = {
        ...inputData,
        isValid: vi.fn().mockImplementation(() => {
          throw validationError;
        }),
      };

      mockFactory.create.mockReturnValueOnce(commandInstance);

      const paramsWithSchema: CommonDbCommandGeneratorParams<TestModel> = {
        ...params,
        validationSchema,
      };

      const handler = createDb(paramsWithSchema);

      const promise = handler({ ...inputData });
      await expect(promise).rejects.toThrow("Invalid input data");
    });

    it("should complete successfully when validation passes", async () => {
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };
      const createdInstance = {
        id: "test-id-123",
        name: "John Doe",
        email: "john@example.com",
      };
      const validationSchema = { validate: vi.fn() } as unknown as z.ZodSchema;

      const commandInstance = {
        ...inputData,
        isValid: vi.fn(),
      };
      const queryInstance = createMockInstance({ id: createdInstance.id } as TestModel);
      const finalInstance = createMockInstance(createdInstance);

      mockFactory.create
        .mockReturnValueOnce(commandInstance)
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(finalInstance);
      mockDao.create.mockResolvedValueOnce(createdInstance.id);
      mockDao.get.mockResolvedValueOnce(createdInstance);

      const paramsWithSchema: CommonDbCommandGeneratorParams<TestModel> = {
        ...params,
        validationSchema,
      };

      const handler = createDb(paramsWithSchema);
      const result = await handler({ ...inputData });

      expect(result).toEqual({ data: finalInstance });
      expect(commandInstance.isValid).toHaveBeenCalledWith({ shouldThrow: true });
      expect(mockDao.create).toHaveBeenCalled();
    });
  });
});
