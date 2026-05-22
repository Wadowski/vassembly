import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

const { mockGetById, mockRemoveSoft } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockRemoveSoft: vi.fn(),
}));

vi.mock('@vassembly/domain-agent', () => ({
  default: {
    commands: {
      removeSoft: mockRemoveSoft,
    },
    queries: {
      getById: mockGetById,
    },
  },
}));

import { deleteAgent } from './index';

describe('deleteAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should soft delete owned agents and align archived status', async () => {
    mockGetById.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        status: 'active',
        removedAt: null,
      },
    });
    mockRemoveSoft.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        status: 'archived',
        removedAt: new Date('2026-04-01T00:00:00.000Z'),
      },
    });

    const result = await deleteAgent({ userId: 'user-1', agentId: 'agent-1' });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Agent deleted');
  });

  it('should prevent deleting agents owned by another account', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(deleteAgent({ userId: 'user-2', agentId: 'agent-1' })).rejects.toThrow(NotFoundError);
  });

  it('should keep delete attempts idempotent when agent already archived', async () => {
    mockGetById.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        status: 'archived',
        removedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    });
    mockRemoveSoft.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        status: 'archived',
        removedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    });

    const result = await deleteAgent({ userId: 'user-1', agentId: 'agent-1' });

    expect(result.success).toBe(true);
  });
});
