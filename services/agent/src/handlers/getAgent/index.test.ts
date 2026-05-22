import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

const { mockGetById } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
}));

vi.mock('@vassembly/domain-agent', async () => {
  const { toAgentResponse } = await import('../../../../../domains/agent/src/model/toAgentResponse.js');

  return {
    default: {
      commands: {},
      queries: {
        getById: mockGetById,
      },
    },
    toAgentResponse,
  };
});

import { getAgent } from './index';

const AGENT_ROW = {
  id: 'agent-1',
  userId: 'user-owner',
  name: 'Bot',
  category: 'utility' as const,
  description: 'Hello',
  rule: 'Work',
  status: 'active' as const,
  removedAt: null as Date | null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('getAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return agent payload when caller owns the row', async () => {
    mockGetById.mockResolvedValue({ data: AGENT_ROW });

    const result = await getAgent({ userId: 'user-owner', agentId: 'agent-1' });

    expect(result.agent.id).toBe('agent-1');
    expect(result.agent.userId).toBe('user-owner');
  });

  it('should respond with NotFoundError when identifier valid but owned by someone else', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(getAgent({ userId: 'user-intruder', agentId: 'agent-1' })).rejects.toThrow(NotFoundError);
  });

  it('should respond with NotFoundError when identifier cannot be resolved', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(getAgent({ userId: 'user-owner', agentId: 'missing' })).rejects.toThrow(NotFoundError);
  });
});
