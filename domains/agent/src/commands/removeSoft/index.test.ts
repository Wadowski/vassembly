import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InternalError, NotFoundError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockRemoveSoft, mockGetById } = vi.hoisted(() => ({
  mockRemoveSoft: vi.fn(),
  mockGetById: vi.fn(),
}));

vi.mock('../../clients', () => ({
  agentMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  removeSoftDb: vi.fn(() => mockRemoveSoft),
}));

vi.mock('../../queries', () => ({
  getModelById: mockGetById,
}));

import { removeSoft } from './index';

describe('removeSoft agent command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set removedAt timestamp and archived status together', async () => {
    const removedAt = new Date('2026-04-01T11:30:00.000Z');
    mockGetById.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        name: 'Archived Agent',
        category: 'personal',
        description: 'Done',
        rule: 'N/A',
        status: 'active',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    mockRemoveSoft.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        name: 'Archived Agent',
        category: 'personal',
        description: 'Done',
        rule: 'N/A',
        status: 'archived',
        removedAt,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: removedAt,
      },
    });

    const result = await removeSoft({ id: 'agent-1', userId: 'user-1' });

    expect(mockGetById).toHaveBeenCalledWith({ id: 'agent-1', userId: 'user-1' });
    expect(result.data.removedAt).toEqual(removedAt);
    expect(result.data.status).toBe('archived');
  });

  it('should throw NotFoundError when agent not found', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(removeSoft({ id: 'agent-missing', userId: 'user-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when userId does not match agent owner', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(removeSoft({ id: 'agent-owned', userId: 'wrong-user' })).rejects.toThrow(NotFoundError);
  });

  it('should reject removal when persistence fails unexpectedly', async () => {
    mockGetById.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        name: 'Test',
        category: 'coding',
        description: 'x',
        rule: 'y',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    mockRemoveSoft.mockRejectedValue(new InternalError('Database unavailable'));

    await expect(removeSoft({ id: 'agent-1', userId: 'user-1' })).rejects.toThrow(InternalError);
  });
});
