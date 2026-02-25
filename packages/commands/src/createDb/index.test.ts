import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Model } from "@vassembly/model";
import { WrongParamError } from "@vassembly/errors";
import { createDb } from "./index";
import type { CommonDbCommandGeneratorParams } from "../types";
import { MongoDbDAO } from "@vassembly/client-mongodb";

interface TestModel extends Model {
  id: string;
  name: string;
  email: string;
}

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
    dao: mockDao as unknown as MongoDbDAO<TestModel>,
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

      mockFactory.create
        .mockReturnValueOnce(createdInstance as Partial<TestModel>)
        .mockReturnValueOnce(createdInstance)
        .mockReturnValueOnce(createdInstance as Partial<TestModel>);
      mockDao.create.mockResolvedValueOnce(daoResponse.id);
      mockDao.get.mockResolvedValueOnce(daoResponse);

      const handler = createDb(params);
      const result = await handler({ ...inputData });

      expect(result).toEqual({ data: createdInstance });
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

      mockFactory.create
        .mockReturnValueOnce(createdInstance as Partial<TestModel>)
        .mockReturnValueOnce(createdInstance)
        .mockReturnValueOnce(createdInstance);
      mockDao.create.mockResolvedValueOnce(daoResponse.id);
      mockDao.get.mockResolvedValueOnce(daoResponse);

      const handler = createDb(params);
      const result = await handler({ ...inputData });

      expect(result).toEqual({ data: createdInstance });
      expect(mockDao.create).toHaveBeenCalledOnce();
    });
  });

  describe("error handling", () => {
    it("should propagate dao errors", async () => {
      const inputData = {
        name: "John Doe",
        email: "john@example.com",
      };
      const createdInstance = {
        id: "test-id-789",
        name: "John Doe",
        email: "john@example.com",
      };
      const daoError = new Error("Database connection failed");

      mockFactory.create.mockReturnValueOnce(
        createdInstance as Partial<TestModel>
      );
      mockDao.create.mockRejectedValueOnce(daoError);

      const handler = createDb(params);

      await expect(handler({ ...inputData })).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
