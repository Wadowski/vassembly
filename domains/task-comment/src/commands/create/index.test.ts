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
  taskCommentMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  createDb: vi.fn(() => mockPersist),
}));

import { create } from './index';

describe('create task comment command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist a comment with null agent response when input is valid', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'comment-1',
        taskId: 'task-1',
        userId: 'user-1',
        userText: 'Follow up',
        agentResponse: null,
      },
    });

    const result = await create({
      taskId: 'task-1',
      userId: 'user-1',
      userText: 'Follow up',
    });

    expect(result.data?.userText).toBe('Follow up');
    expect(result.data?.agentResponse).toBeNull();
  });

  it('should throw ValidationError when user text is empty', async () => {
    await expect(
      create({
        taskId: 'task-1',
        userId: 'user-1',
        userText: '   ',
      }),
    ).rejects.toThrow('Comment text is required');
  });
});
