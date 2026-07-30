import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

import { clearByCommentId } from './index';
import { mongoDb } from '@vassembly/client-mongodb';

const mockCollection = {
  deleteMany: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (mongoDb.db.collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollection);
});

describe('clearByCommentId', () => {
  it('should delete usage events for the comment', async () => {
    mockCollection.deleteMany.mockResolvedValue({ deletedCount: 2 });

    await clearByCommentId({ commentId: 'comment-123' });

    expect(mockCollection.deleteMany).toHaveBeenCalledWith({ commentId: 'comment-123' });
  });

  it('should reject empty commentId', async () => {
    await expect(clearByCommentId({ commentId: '' })).rejects.toThrow();
  });
});
