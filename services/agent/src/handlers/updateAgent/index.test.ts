import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, ValidationError } from '@vassembly/errors';

const { mockGetById, mockUpdate } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('@vassembly/domain-agent', async () => {
  const { toAgentResponse } = await import('../../../../../domains/agent/src/model/toAgentResponse.js');

  return {
    default: {
      commands: {
        update: mockUpdate,
      },
      queries: {
        getById: mockGetById,
      },
    },
    toAgentResponse,
  };
});

import { updateAgent } from './index';

const ACTIVE_AGENT = {
  id: 'agent-1',
  userId: 'user-1',
  name: 'Original',
  category: 'coding' as const,
  description: 'Desc',
  rule: 'Rule',
  status: 'active' as const,
  removedAt: null as Date | null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('updateAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist partial updates for owned agents that remain active', async () => {
    mockGetById.mockResolvedValue({ data: ACTIVE_AGENT });
    mockUpdate.mockResolvedValue({
      data: {
        ...ACTIVE_AGENT,
        name: 'Renamed',
        updatedAt: new Date('2026-02-02T00:00:00.000Z'),
      },
    });

    const result = await updateAgent({
      userId: 'user-1',
      agentId: 'agent-1',
      patch: { name: 'Renamed' },
    });

    expect(result.agent.name).toBe('Renamed');
    expect(result.agent.userId).toBe('user-1');
  });

  it('should reject updates when agent has been soft deleted until restored', async () => {
    mockGetById.mockResolvedValue({
      data: {
        ...ACTIVE_AGENT,
        removedAt: new Date('2026-03-01T00:00:00.000Z'),
        status: 'archived',
      },
    });

    await expect(
      updateAgent({ userId: 'user-1', agentId: 'agent-1', patch: { name: 'Blocked' } }),
    ).rejects.toThrow('Agent has been deleted; restore before updating.');
  });

  it('should treat cross-user update attempts as missing resources', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(
      updateAgent({ userId: 'user-2', agentId: 'agent-1', patch: { name: 'Hack' } }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should bubble validation errors without mutating stored agents', async () => {
    mockGetById.mockResolvedValue({ data: ACTIVE_AGENT });
    mockUpdate.mockRejectedValue(new ValidationError('description too long'));

    await expect(
      updateAgent({
        userId: 'user-1',
        agentId: 'agent-1',
        patch: { description: 'x'.repeat(501) },
      }),
    ).rejects.toThrow(ValidationError);
  });
});
