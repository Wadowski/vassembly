import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Model } from "@vassembly/model";
import { z } from "zod";
import { WrongParamError } from "@vassembly/errors";
import { updateDbById } from ".";
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
    dao: mockDao as unknown as MongoDbDAOType<TestModel>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful update", () => {
    it("should update and return data when instance is valid", async () => {
      const id = "507f1f77bcf86cd799439011";
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
      const id = "507f1f77bcf86cd799439012";
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
      const queryInstance = {
        id: "",
        isValid: vi.fn().mockImplementation(() => {
          throw new WrongParamError("Id is missing or invalid");
        }),
      };

      mockFactory.create.mockReturnValueOnce(queryInstance as Partial<TestModel>);

      const handler = updateDbById(params);

      await expect(handler({ id: "", data: inputData })).rejects.toThrow(
        WrongParamError
      );
      expect(mockDao.update).not.toHaveBeenCalled();
    });

    it("should throw WrongParamError when id is undefined", async () => {
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };
      const queryInstance = {
        id: "",
        isValid: vi.fn().mockImplementation(() => {
          throw new WrongParamError("Id is missing or invalid");
        }),
      };

      mockFactory.create.mockReturnValueOnce(queryInstance as Partial<TestModel>);

      const handler = updateDbById(params);

      await expect(handler({ id: "", data: inputData })).rejects.toThrow(
        WrongParamError
      );
      expect(mockDao.update).not.toHaveBeenCalled();
    });

    it("should propagate dao errors", async () => {
      const id = "507f1f77bcf86cd799439013";
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };
      const daoError = new Error("Database connection failed");

      const queryInstance = createMockInstance({ id } as TestModel);
      const commandInstance = createMockInstance(inputData as TestModel);

      mockFactory.create
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(commandInstance);
      mockDao.update.mockRejectedValueOnce(daoError);

      const handler = updateDbById(params);

      await expect(handler({ id, data: inputData })).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("validation schema", () => {
    it("should always call isValid for id since VALIDATION_SCHEMA is built-in", async () => {
      const id = "507f1f77bcf86cd799439011";
      const inputData = {
        name: "John Doe Updated",
        email: "john.updated@example.com",
      };
      const updatedInstance = {
        id,
        ...inputData,
      };
      const queryInstance = {
        id,
        isValid: vi.fn(),
      };
      const commandInstance = createMockInstance(inputData as TestModel);

      mockFactory.create
        .mockReturnValueOnce(queryInstance as Partial<TestModel>)
        .mockReturnValueOnce(commandInstance)
        .mockReturnValueOnce(createMockInstance(updatedInstance))
        .mockReturnValueOnce(updatedInstance);
      mockDao.update.mockResolvedValueOnce(updatedInstance);
      mockDao.get.mockResolvedValueOnce(updatedInstance);

      const handler = updateDbById(params);
      await handler({ id, data: inputData });

      expect(queryInstance.isValid).toHaveBeenCalledWith({ shouldThrow: true });
    });

    it("should not validate data when validationSchema is not provided", async () => {
      const id = "507f1f77bcf86cd799439011";
      const inputData = {
        name: "John Doe Updated",
        email: "john.updated@example.com",
      };
      const updatedInstance = {
        id,
        ...inputData,
      };
      const queryInstance = createMockInstance({ id } as TestModel);
      const commandInstance = createMockInstance(inputData as TestModel);

      mockFactory.create
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(commandInstance)
        .mockReturnValueOnce(createMockInstance(updatedInstance))
        .mockReturnValueOnce(updatedInstance);
      mockDao.update.mockResolvedValueOnce(updatedInstance);
      mockDao.get.mockResolvedValueOnce(updatedInstance);

      const handler = updateDbById(params);
      const result = await handler({ id, data: inputData });

      expect(result).toEqual({ data: updatedInstance });
      expect(mockDao.update).toHaveBeenCalled();
    });

    it("should throw WrongParamError when data fails schema validation", async () => {
      const id = "507f1f77bcf86cd799439011";
      const inputData = {
        name: "John Doe Updated",
        email: "john.updated@example.com",
        unexpectedField: "not allowed",
      };
      const validationSchema = z
        .object({
          name: z.string(),
          email: z.string(),
        })
        .strict();
      const queryInstance = createMockInstance({ id } as TestModel);

      mockFactory.create.mockReturnValueOnce(queryInstance);

      const paramsWithSchema: CommonDbCommandGeneratorParams<TestModel> = {
        ...params,
        validationSchema,
      };

      const handler = updateDbById(paramsWithSchema);

      await expect(handler({ id, data: inputData })).rejects.toThrow(WrongParamError);
      expect(mockDao.update).not.toHaveBeenCalled();
    });

    it("should complete successfully when data validation passes", async () => {
      const id = "507f1f77bcf86cd799439011";
      const inputData = {
        name: "John Doe Updated",
        email: "john.updated@example.com",
      };
      const updatedInstance = {
        id,
        ...inputData,
      };
      const validationSchema = z.object({
        name: z.string(),
        email: z.string(),
      });
      const queryInstance = createMockInstance({ id } as TestModel);
      const commandInstance = createMockInstance(inputData as TestModel);

      mockFactory.create
        .mockReturnValueOnce(queryInstance)
        .mockReturnValueOnce(commandInstance)
        .mockReturnValueOnce(createMockInstance(updatedInstance))
        .mockReturnValueOnce(updatedInstance);
      mockDao.update.mockResolvedValueOnce(updatedInstance);
      mockDao.get.mockResolvedValueOnce(updatedInstance);

      const paramsWithSchema: CommonDbCommandGeneratorParams<TestModel> = {
        ...params,
        validationSchema,
      };

      const handler = updateDbById(paramsWithSchema);
      const result = await handler({ id, data: inputData });

      expect(result).toEqual({ data: updatedInstance });
      expect(mockDao.update).toHaveBeenCalled();
    });
  });
});
