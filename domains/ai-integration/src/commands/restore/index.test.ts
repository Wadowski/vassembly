import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WrongParamError } from '@vassembly/errors';

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
  aiIntegrationMongodbDao: {
    update: mockUpdate,
  },
}));

vi.mock('../../queries', () => ({
  getById: mockGetById,
}));

import { restore } from './index';

describe('restore ai integration command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should restore archived credential to active status', async () => {
    mockGetById
      .mockResolvedValueOnce({
        data: {
          id: 'cred-1',
          userId: 'user-1',
          status: 'archived',
          removedAt: new Date('2026-03-01T00:00:00.000Z'),
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'cred-1',
          userId: 'user-1',
          status: 'active',
          removedAt: null,
        },
      });
    mockUpdate.mockResolvedValue('cred-1');

    const result = await restore({ id: 'cred-1', userId: 'user-1' });

    expect(mockUpdate).toHaveBeenCalled();
    expect(result.data.status).toBe('active');
    expect(result.data.removedAt).toBeNull();
  });

  it('should reject restore when credential is not archived', async () => {
    mockGetById.mockResolvedValue({
      data: {
        id: 'cred-1',
        userId: 'user-1',
        status: 'active',
        removedAt: null,
      },
    });

    await expect(restore({ id: 'cred-1', userId: 'user-1' })).rejects.toThrow(WrongParamError);
  });
});
