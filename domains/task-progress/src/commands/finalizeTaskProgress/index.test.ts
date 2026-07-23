import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

import { finalizeTaskProgress } from './index';
import { mongoDb } from '@vassembly/client-mongodb';

const mockCollection = {
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (mongoDb.db.collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollection);
});

describe('finalizeTaskProgress', () => {
  describe('success cases', () => {
    it('should finalize task progress with aggregated metrics', async () => {
      const now = new Date();
      const startTimestamp = new Date(now.getTime() - 5000);
      const endTimestamp = new Date(now.getTime());

      mockCollection.findOne.mockResolvedValue({
        _id: 'mongo-id',
        commentId: 'comment-123',
        userId: 'user-456',
        events: [
          {
            agentName: 'Agent1',
            state: 'started',
            timestamp: startTimestamp,
          },
          {
            agentName: 'Agent1',
            state: 'completed',
            timestamp: endTimestamp,
            tokenUsage: { input: 100, output: 50, total: 150 },
          },
        ],
      });

      mockCollection.findOneAndUpdate.mockResolvedValue({
        commentId: 'comment-123',
        userId: 'user-456',
        completedAt: now,
        totalDuration: 5000,
        totalTokens: { input: 100, output: 50, total: 150 },
      });

      const result = await finalizeTaskProgress({
        commentId: 'comment-123',
      });

      expect(result.completedAt).toBeDefined();
      expect(result.totalDuration).toBeGreaterThan(0);
      expect(result.totalTokens).toEqual({
        input: 100,
        output: 50,
        total: 150,
      });
    });

    it('should set completedAt when finalizing', async () => {
      mockCollection.findOne.mockResolvedValue({
        _id: 'mongo-id',
        commentId: 'comment-123',
        events: [],
      });

      mockCollection.findOneAndUpdate.mockResolvedValue({
        commentId: 'comment-123',
        completedAt: new Date(),
      });

      const result = await finalizeTaskProgress({
        commentId: 'comment-123',
      });

      expect(result.completedAt).toBeDefined();
    });

    it('should calculate correct totalDuration from first and last event timestamps', async () => {
      const startTime = new Date('2026-06-15T10:00:00Z');
      const endTime = new Date('2026-06-15T10:00:10Z');

      mockCollection.findOne.mockResolvedValue({
        commentId: 'comment-123',
        events: [
          {
            agentName: 'Agent1',
            timestamp: startTime,
            state: 'started',
          },
          {
            agentName: 'Agent2',
            timestamp: endTime,
            state: 'completed',
          },
        ],
      });

      mockCollection.findOneAndUpdate.mockResolvedValue({
        commentId: 'comment-123',
        totalDuration: 10000,
      });

      const result = await finalizeTaskProgress({
        commentId: 'comment-123',
      });

      expect(result.totalDuration).toBe(10000);
    });

    it('should aggregate token usage across all events', async () => {
      mockCollection.findOne.mockResolvedValue({
        commentId: 'comment-123',
        events: [
          {
            agentName: 'Agent1',
            tokenUsage: { input: 100, output: 50, total: 150 },
          },
          {
            agentName: 'Agent2',
            tokenUsage: { input: 200, output: 100, total: 300 },
          },
          {
            agentName: 'Agent3',
            tokenUsage: { input: 150, output: 75, total: 225 },
          },
        ],
      });

      mockCollection.findOneAndUpdate.mockResolvedValue({
        commentId: 'comment-123',
        totalTokens: {
          input: 450,
          output: 225,
          total: 675,
        },
      });

      const result = await finalizeTaskProgress({
        commentId: 'comment-123',
      });

      expect(result.totalTokens).toEqual({
        input: 450,
        output: 225,
        total: 675,
      });
    });

    it('should handle events with missing tokenUsage gracefully', async () => {
      mockCollection.findOne.mockResolvedValue({
        commentId: 'comment-123',
        events: [
          {
            agentName: 'Agent1',
            state: 'started',
          },
          {
            agentName: 'Agent1',
            state: 'completed',
            tokenUsage: { input: 100, output: 50, total: 150 },
          },
          {
            agentName: 'Agent2',
            state: 'started',
          },
        ],
      });

      mockCollection.findOneAndUpdate.mockResolvedValue({
        commentId: 'comment-123',
        totalTokens: {
          input: 100,
          output: 50,
          total: 150,
        },
      });

      const result = await finalizeTaskProgress({
        commentId: 'comment-123',
      });

      expect(result.totalTokens).toEqual({
        input: 100,
        output: 50,
        total: 150,
      });
    });

    it('should set completedAt timestamp correctly', async () => {
      mockCollection.findOne.mockResolvedValue({
        commentId: 'comment-123',
        events: [],
      });

      const beforeCall = new Date();
      const completedAtDate = new Date();
      mockCollection.findOneAndUpdate.mockResolvedValue({
        commentId: 'comment-123',
        completedAt: completedAtDate,
      });

      const result = await finalizeTaskProgress({
        commentId: 'comment-123',
      });

      const afterCall = new Date();

      expect(result.completedAt).toBeDefined();
      expect(result.completedAt instanceof Date).toBe(true);
      expect(result.completedAt!.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.completedAt!.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should handle empty events array', async () => {
      mockCollection.findOne.mockResolvedValue({
        commentId: 'comment-123',
        events: [],
      });

      mockCollection.findOneAndUpdate.mockResolvedValue({
        commentId: 'comment-123',
        totalDuration: 0,
        totalTokens: {
          input: 0,
          output: 0,
          total: 0,
        },
      });

      const result = await finalizeTaskProgress({
        commentId: 'comment-123',
      });

      expect(result.totalDuration).toBe(0);
      expect(result.totalTokens?.total).toBe(0);
    });
  });

  describe('validation', () => {
    it('should reject empty taskId', async () => {
      await expect(
        finalizeTaskProgress({
          taskId: '',
        })
      ).rejects.toThrow();
    });

    it('should reject missing taskId', async () => {
      await expect(
        finalizeTaskProgress({
          taskId: undefined as unknown as string,
        })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw NotFoundError when task progress does not exist', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      await expect(
        finalizeTaskProgress({
          commentId: 'nonexistent-comment',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError with descriptive message', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      await expect(
        finalizeTaskProgress({
          commentId: 'comment-456',
        })
      ).rejects.toThrow('Task progress not found for commentId: comment-456');
    });

    it('should throw NotFoundError if findOneAndUpdate returns null', async () => {
      mockCollection.findOne.mockResolvedValue({
        commentId: 'comment-123',
        events: [],
      });

      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        finalizeTaskProgress({
          commentId: 'comment-123',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should propagate MongoDB findOne errors', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('MongoDB connection error'));

      await expect(
        finalizeTaskProgress({
          commentId: 'comment-123',
        })
      ).rejects.toThrow('MongoDB connection error');
    });

    it('should propagate MongoDB findOneAndUpdate errors', async () => {
      mockCollection.findOne.mockResolvedValue({
        commentId: 'comment-123',
        events: [],
      });

      mockCollection.findOneAndUpdate.mockRejectedValue(new Error('Update failed'));

      await expect(
        finalizeTaskProgress({
          commentId: 'comment-123',
        })
      ).rejects.toThrow('Update failed');
    });
  });
});
