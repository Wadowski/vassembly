import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Model } from "@vassembly/model";
import { NotFoundError, WrongParamError } from "@vassembly/errors";
import { getDbById } from './index';
import type { CommonDbQueryGeneratorParams } from "../types";
import { MongoDbDAO } from '@vassembly/client-mongodb';

interface TestModel extends Model {
  id: string;
  name: string;
  email: string;
}

describe('getDbById', () => {
  const mockFactory = {
    create: vi.fn(),
    createMany: vi.fn(),
  };

  const mockDao = {
    get: vi.fn(),
    getMany: vi.fn(),
  };

  const params: CommonDbQueryGeneratorParams<TestModel> = {
    factory: mockFactory,
    dao: mockDao as unknown as MongoDbDAO<TestModel>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful queries', () => {
    it('should return data when instance is found', async () => {
      const id = 'test-id-123';
      const daoResponse = {
        id,
        name: 'John Doe',
        email: 'john@example.com',
      };
      const createdInstance = {
        id,
        name: 'John Doe',
        email: 'john@example.com',
      };

      mockFactory.create
        .mockReturnValueOnce({ id } as Partial<TestModel>)
        .mockReturnValueOnce(createdInstance);
      mockDao.get.mockResolvedValueOnce(daoResponse);

      const handler = getDbById(params);
      const result = await handler({ id });

      expect(result).toEqual({ data: createdInstance });
      expect(mockFactory.create).toHaveBeenCalledTimes(2);
      expect(mockFactory.create).toHaveBeenNthCalledWith(1, { id });
      expect(mockDao.get).toHaveBeenCalledOnce();
      expect(mockDao.get).toHaveBeenCalledWith({ id });
    });

    it('should handle instances with additional properties', async () => {
      const id = 'test-id-456';
      const daoResponse = {
        id,
        name: 'Jane Smith',
        email: 'jane@example.com',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
      };
      const createdInstance = { ...daoResponse };

      mockFactory.create
        .mockReturnValueOnce({ id } as Partial<TestModel>)
        .mockReturnValueOnce(createdInstance);
      mockDao.get.mockResolvedValueOnce(daoResponse);

      const handler = getDbById(params);
      const result = await handler({ id });

      expect(result).toEqual({ data: createdInstance });
      expect(mockDao.get).toHaveBeenCalledOnce();
    });
  });

  describe('error handling', () => {
    it('should throw WrongParamError when factory returns instance without id', async () => {
      const id = 'test-id-789';

      mockFactory.create.mockReturnValueOnce({} as Partial<TestModel>);

      const handler = getDbById(params);

      const promise = handler({ id });
      await expect(promise).rejects.toThrow(WrongParamError);
      await expect(promise).rejects.toThrow('Id is missing');
      expect(mockDao.get).not.toHaveBeenCalled();
    });


    it('should throw NotFoundError when instance is not found in dao', async () => {
      const id = 'non-existent-id';

      mockFactory.create.mockReturnValueOnce({ id } as Partial<TestModel>);
      mockDao.get.mockResolvedValueOnce(null);

      const handler = getDbById(params);

      const promise = handler({ id });
      await expect(promise).rejects.toThrow(NotFoundError);
      await expect(promise).rejects.toThrow(`Instance with id ${id} not found`);
    });

    it('should propagate dao errors', async () => {
      const id = 'test-id-error';
      const daoError = new Error('Database connection failed');

      mockFactory.create.mockReturnValueOnce({ id } as Partial<TestModel>);
      mockDao.get.mockRejectedValueOnce(daoError);

      const handler = getDbById(params);

      await expect(handler({ id })).rejects.toThrow('Database connection failed');
    });
  });
});
