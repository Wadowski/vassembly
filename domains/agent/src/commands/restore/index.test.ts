import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, WrongParamError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockUpdate, mockGetById } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockGetById: vi.fn(),
}));

vi.mock('../../clients', () => ({
  agentMongodbDao: {
    update: mockUpdate,
  },
}));

vi.mock('../../queries', () => ({
  getById: mockGetById,
}));

import { restore } from './index';

describe('restore agent command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear removedAt and set active status when row was soft deleted', async () => {
    mockGetById
      .mockResolvedValueOnce({
        data: {
          id: 'agent-1',
          userId: 'user-1',
          name: 'Back Online',
          category: 'utility',
          description: 'Ready again',
          rule: 'Go',
          status: 'archived',
          removedAt: new Date('2026-03-01T00:00:00.000Z'),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-04-01T00:00:00.000Z'),
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'agent-1',
          userId: 'user-1',
          name: 'Back Online',
          category: 'utility',
          description: 'Ready again',
          rule: 'Go',
          status: 'active',
          removedAt: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      });
    mockUpdate.mockResolvedValue(undefined);

    const result = await restore({ id: 'agent-1', userId: 'user-1' });

    expect(result.data.removedAt).toBeNull();
    expect(result.data.status).toBe('active');
  });

  it('should reject restore when agent has never been deleted', async () => {
    mockGetById.mockResolvedValue({
      data: {
        id: 'agent-live',
        userId: 'user-1',
        name: 'Live Agent',
        category: 'coding',
        description: 'Still active',
        rule: 'Run',
        status: 'active',
        removedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });

    await expect(restore({ id: 'agent-live', userId: 'user-1' })).rejects.toThrow(WrongParamError);
  });

  it('should enforce tenant isolation via owning user identifier', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(restore({ id: 'agent-other', userId: 'user-1' })).rejects.toThrow(NotFoundError);
  });
});
