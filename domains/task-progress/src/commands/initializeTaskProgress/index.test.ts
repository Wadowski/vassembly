import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

import { initializeTaskProgress } from './index';
import { mongoDb } from '@vassembly/client-mongodb';

const mockCollection = {
  findOne: vi.fn(),
  insertOne: vi.fn(),
};

const BASE_INPUT = {
  taskId: 'task-123',
  userId: 'user-456',
  commentId: 'comment-123',
};

beforeEach(() => {
  vi.clearAllMocks();
  (mongoDb.db.collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollection);
});

describe('initializeTaskProgress', () => {
  describe('success cases', () => {
    it('should create new task progress document when none exists', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true });

      const result = await initializeTaskProgress(BASE_INPUT);

      expect(result).toBeDefined();
      expect(result.taskId).toBe('task-123');
      expect(result.commentId).toBe('comment-123');
      expect(result.userId).toBe('user-456');
      expect(result.completedAt).toBeNull();
      expect(result.events).toEqual([]);
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('should be idempotent - skip if document already exists', async () => {
      const existingDoc = {
        _id: 'mongo-id',
        taskId: 'task-123',
        commentId: 'comment-123',
        userId: 'user-456',
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: null,
        events: [],
        totalDuration: 0,
        totalTokens: { input: 0, output: 0, total: 0 },
      };

      mockCollection.findOne.mockResolvedValue(existingDoc);

      const result = await initializeTaskProgress(BASE_INPUT);

      expect(result.commentId).toBe('comment-123');
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should reject empty commentId', async () => {
      await expect(
        initializeTaskProgress({
          ...BASE_INPUT,
          commentId: '',
        }),
      ).rejects.toThrow();
    });
  });
});
