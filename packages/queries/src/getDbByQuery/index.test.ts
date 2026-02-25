import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Model } from "@vassembly/model";
import { getListDbByQuery } from './index';
import type { CommonDbQueryGeneratorParams } from "../types";
import { MongoDbDAO } from '@vassembly/client-mongodb';

interface TestModel extends Model {
  id: string;
  name: string;
  email: string;
}

describe('getListDbByQuery', () => {
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
    it('should return array of data when instances are found', async () => {
      const daoResponse = [
        { id: 'id-1', name: 'John Doe', email: 'john@example.com' },
        { id: 'id-2', name: 'Jane Smith', email: 'jane@example.com' },
      ];
      const createdInstances = [
        { id: 'id-1', name: 'John Doe', email: 'john@example.com' },
        { id: 'id-2', name: 'Jane Smith', email: 'jane@example.com' },
      ];
      const limit = 10;
      const offset = 0;

      mockFactory.create.mockReturnValueOnce({} as Partial<TestModel>);
      mockFactory.createMany.mockReturnValueOnce(createdInstances);
      mockDao.getMany.mockResolvedValueOnce(daoResponse);

      const handler = getListDbByQuery(params);
      const result = await handler({ limit, offset });

      expect(result).toEqual({ data: createdInstances });
      expect(mockFactory.create).toHaveBeenCalledOnce();
      expect(mockFactory.createMany).toHaveBeenCalledOnce();
      expect(mockFactory.createMany).toHaveBeenCalledWith(daoResponse);
      expect(mockDao.getMany).toHaveBeenCalledOnce();
    });

    it('should return empty array when no instances are found', async () => {
      const daoResponse: any[] = [];
      const createdInstances: any[] = [];
      const limit = 10;
      const offset = 0;

      mockFactory.create.mockReturnValueOnce({} as Partial<TestModel>);
      mockFactory.createMany.mockReturnValueOnce(createdInstances);
      mockDao.getMany.mockResolvedValueOnce(daoResponse);

      const handler = getListDbByQuery(params);
      const result = await handler({ limit, offset });

      expect(result).toEqual({ data: [] });
      expect(mockFactory.createMany).toHaveBeenCalledWith(daoResponse);
    });

    it('should handle instances with additional properties', async () => {
      const daoResponse = [
        {
          id: 'id-1',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
        },
        {
          id: 'id-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-21'),
        },
      ];
      const createdInstances = daoResponse;
      const limit = 10;
      const offset = 0;

      mockFactory.create.mockReturnValueOnce({} as Partial<TestModel>);
      mockFactory.createMany.mockReturnValueOnce(createdInstances);
      mockDao.getMany.mockResolvedValueOnce(daoResponse);

      const handler = getListDbByQuery(params);
      const result = await handler({ limit, offset });

      expect(result).toEqual({ data: createdInstances });
      expect(mockDao.getMany).toHaveBeenCalledOnce();
    });

    it('should pass limit and offset to dao.getMany', async () => {
      const limit = 20;
      const offset = 40;
      const daoResponse: any[] = [];
      const createdInstances: any[] = [];

      mockFactory.create.mockReturnValueOnce({} as Partial<TestModel>);
      mockFactory.createMany.mockReturnValueOnce(createdInstances);
      mockDao.getMany.mockResolvedValueOnce(daoResponse);

      const handler = getListDbByQuery(params);
      await handler({ limit, offset });

      expect(mockDao.getMany).toHaveBeenCalledWith(
        expect.any(Object),
        { limit, offset }
      );
    });
  });

  describe('error handling', () => {
    it('should propagate dao errors', async () => {
      const daoError = new Error('Database connection failed');
      const limit = 10;
      const offset = 0;

      mockFactory.create.mockReturnValueOnce({} as Partial<TestModel>);
      mockDao.getMany.mockRejectedValueOnce(daoError);

      const handler = getListDbByQuery(params);

      const promise = handler({ limit, offset });
      await expect(promise).rejects.toThrow('Database connection failed');
    });
  });
});
