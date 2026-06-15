import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

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

beforeEach(() => {
  vi.clearAllMocks();
  (mongoDb.db.collection as any).mockReturnValue(mockCollection);
});

describe('initializeTaskProgress', () => {
  describe('success cases', () => {
    it('should create new task progress document when none exists', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true });

      const result = await initializeTaskProgress({
        taskId: 'task-123',
        userId: 'user-456',
      });

      expect(result).toBeDefined();
      expect(result.taskId).toBe('task-123');
      expect(result.userId).toBe('user-456');
      expect(result.completedAt).toBeNull();
      expect(result.events).toEqual([]);
      expect(result.totalDuration).toBe(0);
      expect(result.totalTokens).toEqual({
        input: 0,
        output: 0,
        total: 0,
      });
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('should be idempotent - skip if document already exists', async () => {
      const existingDoc = {
        _id: 'mongo-id',
        taskId: 'task-123',
        userId: 'user-456',
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: null,
        events: [],
        totalDuration: 0,
        totalTokens: { input: 0, output: 0, total: 0 },
      };

      mockCollection.findOne.mockResolvedValue(existingDoc);

      const result = await initializeTaskProgress({
        taskId: 'task-123',
        userId: 'user-456',
      });

      expect(result.taskId).toBe('task-123');
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should set correct timestamps on creation', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockResolvedValue({ acknowledged: true });

      const beforeCall = new Date();
      const result = await initializeTaskProgress({
        taskId: 'task-123',
        userId: 'user-456',
      });
      const afterCall = new Date();

      expect(result.createdAt).toBeDefined();
      expect(result.startedAt).toBeDefined();
      expect(result.createdAt!.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.createdAt!.getTime()).toBeLessThanOrEqual(afterCall.getTime());
      expect(result.startedAt!.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.startedAt!.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  describe('validation', () => {
    it('should reject empty taskId', async () => {
      await expect(
        initializeTaskProgress({
          taskId: '',
          userId: 'user-456',
        })
      ).rejects.toThrow();
    });

    it('should reject empty userId', async () => {
      await expect(
        initializeTaskProgress({
          taskId: 'task-123',
          userId: '',
        })
      ).rejects.toThrow();
    });

    it('should reject missing taskId', async () => {
      await expect(
        initializeTaskProgress({
          taskId: undefined as any,
          userId: 'user-456',
        })
      ).rejects.toThrow();
    });

    it('should reject missing userId', async () => {
      await expect(
        initializeTaskProgress({
          taskId: 'task-123',
          userId: undefined as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should propagate MongoDB collection errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('MongoDB connection error'));

      await expect(
        initializeTaskProgress({
          taskId: 'task-123',
          userId: 'user-456',
        })
      ).rejects.toThrow('MongoDB connection error');
    });

    it('should propagate MongoDB insertOne errors', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.insertOne.mockRejectedValue(new Error('Duplicate key error'));

      await expect(
        initializeTaskProgress({
          taskId: 'task-123',
          userId: 'user-456',
        })
      ).rejects.toThrow('Duplicate key error');
    });
  });
});
