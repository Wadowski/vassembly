import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

import { resetTaskProgress } from './index';
import { mongoDb } from '@vassembly/client-mongodb';

const mockCollection = {
  updateOne: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (mongoDb.db.collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollection);
});

describe('resetTaskProgress', () => {
  describe('success cases', () => {
    it('should clear completedAt', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      await resetTaskProgress({ commentId: 'comment-123' });

      const callArgs = mockCollection.updateOne.mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs![1]).toHaveProperty('$unset');
      expect(callArgs![1].$unset).toEqual({ completedAt: 1 });
    });

    it('should set events array to empty', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      await resetTaskProgress({ commentId: 'comment-123' });

      const callArgs = mockCollection.updateOne.mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs![1].$set).toMatchObject({ events: [] });
    });

    it('should reset metrics', async () => {
      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      await resetTaskProgress({ commentId: 'comment-123' });

      const callArgs = mockCollection.updateOne.mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs![1].$set).toMatchObject({
        totalDuration: 0,
        totalTokens: {
          input: 0,
          output: 0,
          total: 0,
        },
      });
    });
  });

  describe('validation', () => {
    it('should reject empty commentId', async () => {
      await expect(
        resetTaskProgress({
          commentId: '',
        })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should propagate MongoDB updateOne errors', async () => {
      mockCollection.updateOne.mockRejectedValue(new Error('MongoDB connection error'));

      await expect(
        resetTaskProgress({
          commentId: 'comment-123',
        })
      ).rejects.toThrow('MongoDB connection error');
    });
  });
});
