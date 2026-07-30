import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockFindOne } = vi.hoisted(() => ({
  mockFindOne: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskPlanInstanceMongodbDao: {
    findOne: mockFindOne,
  },
}));

import { getByCommentId } from './index';

const COMMENT_ID = '507f1f77bcf86cd799439011';
const INSTANCE_ID = '507f1f77bcf86cd799439099';

describe('getByCommentId task plan instance query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return instance when commentId exists', async () => {
    mockFindOne.mockResolvedValue({
      id: INSTANCE_ID,
      commentId: COMMENT_ID,
    });

    const result = await getByCommentId({ commentId: COMMENT_ID });

    expect(result.data?.id).toBe(INSTANCE_ID);
    expect(result.data?.commentId).toBe(COMMENT_ID);
  });

  it('should return null when no instance exists for commentId', async () => {
    mockFindOne.mockResolvedValue(null);

    const result = await getByCommentId({ commentId: COMMENT_ID });

    expect(result.data).toBeNull();
  });
});
