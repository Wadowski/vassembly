import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

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
  aiIntegrationMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  removeSoftDb: vi.fn(() => mockRemoveSoft),
}));

vi.mock('../../queries', () => ({
  getById: mockGetById,
}));

import { removeSoft } from './index';

describe('removeSoft ai integration command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should archive credential after ownership check', async () => {
    const removedAt = new Date('2026-04-01T11:30:00.000Z');
    mockGetById.mockResolvedValue({
      data: {
        id: 'cred-1',
        userId: 'user-1',
        name: 'Gemini',
        provider: 'gemini',
        status: 'active',
      },
    });
    mockRemoveSoft.mockResolvedValue({
      data: {
        id: 'cred-1',
        userId: 'user-1',
        status: 'archived',
        removedAt,
      },
    });

    const result = await removeSoft({ id: 'cred-1', userId: 'user-1' });

    expect(mockGetById).toHaveBeenCalledWith({ id: 'cred-1', userId: 'user-1' });
    expect(result.data.status).toBe('archived');
    expect(result.data.removedAt).toEqual(removedAt);
  });

  it('should throw NotFoundError when credential not found', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('AI integration credential not found'));

    await expect(removeSoft({ id: 'cred-missing', userId: 'user-1' })).rejects.toThrow(NotFoundError);
  });
});
