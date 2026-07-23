import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockPersist } = vi.hoisted(() => ({
  mockPersist: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  updateDbById: vi.fn(() => mockPersist),
}));

import { complete } from './index';

describe('complete task command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist done status and completedAt when input is valid', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'task-1',
        status: 'done',
        completedAt: new Date('2026-06-04T12:00:00.000Z'),
        activeCommentId: null,
      },
    });

    const result = await complete({ taskId: 'task-1' });

    expect(mockPersist).toHaveBeenCalledWith({
      id: 'task-1',
      data: expect.objectContaining({
        status: 'done',
        activeCommentId: null,
        completedAt: expect.any(Date),
      }),
    });
    expect(result.data?.status).toBe('done');
  });
});
