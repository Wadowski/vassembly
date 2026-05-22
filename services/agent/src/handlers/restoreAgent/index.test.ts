import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, WrongParamError } from '@vassembly/errors';

const { mockGetById, mockRestore } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockRestore: vi.fn(),
}));

vi.mock('@vassembly/domain-agent', async () => {
  const { toAgentResponse } = await import('../../../../../domains/agent/src/model/toAgentResponse.js');

  return {
    default: {
      commands: {
        restore: mockRestore,
      },
      queries: {
        getById: mockGetById,
      },
    },
    toAgentResponse,
  };
});

import { restoreAgent } from './index';

describe('restoreAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear removal markers for owned archived agents', async () => {
    mockGetById.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        status: 'archived',
        removedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });
    mockRestore.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        name: 'Back',
        category: 'coding',
        description: 'Hi',
        rule: 'Go',
        status: 'active',
        removedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-01T00:00:00.000Z'),
      },
    });

    const result = await restoreAgent({ userId: 'user-1', agentId: 'agent-1' });

    expect(result.agent.removedAt).toBeNull();
    expect(result.agent.status).toBe('active');
  });

  it('should reject restore when agent is not deleted', async () => {
    mockGetById.mockResolvedValue({
      data: {
        id: 'agent-live',
        userId: 'user-1',
        status: 'active',
        removedAt: null,
      },
    });

    await expect(restoreAgent({ userId: 'user-1', agentId: 'agent-live' })).rejects.toThrow(WrongParamError);
  });

  it('should deny restore for foreign-owned identifiers using NotFoundError semantics', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(restoreAgent({ userId: 'user-2', agentId: 'agent-1' })).rejects.toThrow(NotFoundError);
  });
});
