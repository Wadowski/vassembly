import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

import { getTaskProgressByTaskId } from './index';
import { mongoDb } from '@vassembly/client-mongodb';

const mockCollection = {
  findOne: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (mongoDb.db.collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollection);
});

describe('getTaskProgressByTaskId', () => {
  describe('success cases', () => {
    it('should return full task progress document with user matching', async () => {
      const now = new Date();
      const mockDoc = {
        _id: 'progress-123',
        taskId: 'task-123',
        userId: 'user-456',
        createdAt: now,
        startedAt: now,
        completedAt: null,
        events: [
          {
            id: 'event-1',
            agentName: 'Assistant',
            state: 'started',
            timestamp: now,
          },
        ],
        totalDuration: 0,
        totalTokens: {
          input: 0,
          output: 0,
          total: 0,
        },
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await getTaskProgressByTaskId({
        taskId: 'task-123',
        userId: 'user-456',
      });

      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('progress-123');
      expect(result.data?.taskId).toBe('task-123');
      expect(result.data?.completedAt).toBeNull();
      expect(result.data?.events).toHaveLength(1);
      expect(result.data?.totalTokens).toEqual({
        input: 0,
        output: 0,
        total: 0,
      });
    });

    it('should return null when task progress does not exist', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await getTaskProgressByTaskId({
        taskId: 'nonexistent-task',
        userId: 'user-456',
      });

      expect(result.data).toBeNull();
    });

    it('should query with both taskId and userId in filter', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      await getTaskProgressByTaskId({
        taskId: 'task-123',
        userId: 'user-456',
      });

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        taskId: 'task-123',
        userId: 'user-456',
      });
    });

    it('should include all response fields in result', async () => {
      const now = new Date();
      const mockDoc = {
        id: 'progress-456',
        taskId: 'task-123',
        userId: 'user-456',
        createdAt: now,
        startedAt: now,
        completedAt: now,
        events: [],
        totalDuration: 5000,
        totalTokens: { input: 100, output: 50, total: 150 },
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await getTaskProgressByTaskId({
        taskId: 'task-123',
        userId: 'user-456',
      });

      expect(result.data).toMatchObject({
        taskId: 'task-123',
        completedAt: expect.any(String),
        totalDuration: 5000,
      });
    });
  });

  describe('user scoping and authorization', () => {
    it('should reject query when user does not own the task progress', async () => {
      const mockDoc = {
        _id: 'mongo-id',
        id: 'progress-456',
        taskId: 'task-123',
        userId: 'different-user', // Different user
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      await expect(
        getTaskProgressByTaskId({
          taskId: 'task-123',
          userId: 'user-456',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError with descriptive message', async () => {
      mockCollection.findOne.mockResolvedValue({
        id: 'progress-456',
        taskId: 'task-123',
        userId: 'different-user',
      });

      await expect(
        getTaskProgressByTaskId({
          taskId: 'task-123',
          userId: 'user-456',
        })
      ).rejects.toThrow('Unauthorized access to task progress');
    });

    it('should allow access when userId matches document userId', async () => {
      const now = new Date();
      const mockDoc = {
        id: 'progress-456',
        taskId: 'task-123',
        userId: 'user-456',
        startedAt: now,
        events: [],
        totalDuration: 0,
        totalTokens: { input: 0, output: 0, total: 0 },
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await getTaskProgressByTaskId({
        taskId: 'task-123',
        userId: 'user-456',
      });

      expect(result.data).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should reject empty taskId', async () => {
      await expect(
        getTaskProgressByTaskId({
          taskId: '',
          userId: 'user-456',
        })
      ).rejects.toThrow();
    });

    it('should reject empty userId', async () => {
      await expect(
        getTaskProgressByTaskId({
          taskId: 'task-123',
          userId: '',
        })
      ).rejects.toThrow();
    });

    it('should reject missing taskId', async () => {
      await expect(
        getTaskProgressByTaskId({
          taskId: undefined as unknown as string,
          userId: 'user-456',
        })
      ).rejects.toThrow();
    });

    it('should reject missing userId', async () => {
      await expect(
        getTaskProgressByTaskId({
          taskId: 'task-123',
          userId: undefined as unknown as string,
        })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should propagate MongoDB findOne errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('MongoDB connection error'));

      await expect(
        getTaskProgressByTaskId({
          taskId: 'task-123',
          userId: 'user-456',
        })
      ).rejects.toThrow('MongoDB connection error');
    });

    it('should handle documents with no events gracefully', async () => {
      const now = new Date();
      mockCollection.findOne.mockResolvedValue({
        id: 'progress-456',
        taskId: 'task-123',
        userId: 'user-456',
        startedAt: now,
        events: [],
        totalDuration: 0,
        totalTokens: { input: 0, output: 0, total: 0 },
      });

      const result = await getTaskProgressByTaskId({
        taskId: 'task-123',
        userId: 'user-456',
      });

      expect(result.data?.events).toEqual([]);
    });

    it('should handle documents with no totalTokens gracefully', async () => {
      const now = new Date();
      mockCollection.findOne.mockResolvedValue({
        id: 'progress-456',
        taskId: 'task-123',
        userId: 'user-456',
        startedAt: now,
        events: [],
        totalDuration: 0,
        totalTokens: { input: 0, output: 0, total: 0 },
      });

      const result = await getTaskProgressByTaskId({
        taskId: 'task-123',
        userId: 'user-456',
      });

      expect(result.data).toBeDefined();
    });
  });

  describe('response format', () => {
    it('should return data wrapped in response object', async () => {
      const now = new Date();
      mockCollection.findOne.mockResolvedValue({
        id: 'progress-456',
        taskId: 'task-123',
        userId: 'user-456',
        startedAt: now,
        events: [],
        totalDuration: 0,
        totalTokens: { input: 0, output: 0, total: 0 },
      });

      const result = await getTaskProgressByTaskId({
        taskId: 'task-123',
        userId: 'user-456',
      });

      expect(result).toHaveProperty('data');
    });

    it('should return null wrapped in response object when not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await getTaskProgressByTaskId({
        taskId: 'nonexistent',
        userId: 'user-456',
      });

      expect(result).toHaveProperty('data');
      expect(result.data).toBeNull();
    });
  });
});
