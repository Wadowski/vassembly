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
  updateDbById: vi.fn(() => mockPersist),
}));

import { setAgentResponse } from './index';

describe('setAgentResponse command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist agent response when input is valid', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'comment-1',
        agentResponse: 'Done',
      },
    });

    const result = await setAgentResponse({
      commentId: 'comment-1',
      agentResponse: 'Done',
    });

    expect(result.data?.agentResponse).toBe('Done');
  });

  it('should throw ValidationError when agent response exceeds 5000 characters', async () => {
    await expect(
      setAgentResponse({
        commentId: 'comment-1',
        agentResponse: 'x'.repeat(5001),
      }),
    ).rejects.toThrow('Response exceeds 5000 characters');
  });
});
