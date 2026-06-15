import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

import { getModelByTaskId } from './index';
import { mongoDb } from '@vassembly/client-mongodb';

const mockCollection = {
  findOne: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (mongoDb.db.collection as any).mockReturnValue(mockCollection);
});

describe('getModelByTaskId', () => {
  describe('success cases', () => {
    it('should return raw model when document exists', async () => {
      const mockDoc = {
        _id: 'mongo-id',
        taskId: 'task-123',
        userId: 'user-456',
        events: [],
        totalTokens: { input: 0, output: 0, total: 0 },
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await getModelByTaskId({
        taskId: 'task-123',
      });

      expect(result.data).toBeDefined();
      expect(result.data?.taskId).toBe('task-123');
    });

    it('should return null when document does not exist', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await getModelByTaskId({
        taskId: 'nonexistent-task',
      });

      expect(result.data).toBeNull();
    });

    it('should query by taskId only (internal query, no userId check)', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      await getModelByTaskId({
        taskId: 'task-123',
      });

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        taskId: 'task-123',
      });
    });
  });

  describe('validation', () => {
    it('should reject empty taskId', async () => {
      await expect(
        getModelByTaskId({
          taskId: '',
        })
      ).rejects.toThrow();
    });

    it('should reject missing taskId', async () => {
      await expect(
        getModelByTaskId({
          taskId: undefined as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should propagate MongoDB findOne errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('MongoDB connection error'));

      await expect(
        getModelByTaskId({
          taskId: 'task-123',
        })
      ).rejects.toThrow('MongoDB connection error');
    });
  });

  describe('response format', () => {
    it('should return result wrapped in response object', async () => {
      mockCollection.findOne.mockResolvedValue({
        taskId: 'task-123',
        events: [],
        totalTokens: { input: 0, output: 0, total: 0 },
      });

      const result = await getModelByTaskId({
        taskId: 'task-123',
      });

      expect(result).toHaveProperty('data');
    });

    it('should return null wrapped in response object', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await getModelByTaskId({
        taskId: 'nonexistent',
      });

      expect(result).toHaveProperty('data');
      expect(result.data).toBeNull();
    });
  });
});
