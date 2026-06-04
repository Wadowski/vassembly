import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InternalError, NotFoundError, WrongParamError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockRemoveSoft, mockGetModelById } = vi.hoisted(() => ({
  mockRemoveSoft: vi.fn(),
  mockGetModelById: vi.fn(),
}));

vi.mock('../../clients', () => ({
  systemAgentMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  removeSoftDb: vi.fn(() => mockRemoveSoft),
}));

vi.mock('../../queries', () => ({
  getModelById: mockGetModelById,
}));

vi.mock('../../cache/keys', () => ({
  invalidateActiveByNameCache: vi.fn().mockResolvedValue(undefined),
}));

import { removeSoft } from './index';

const AGENT_ID = '507f1f77bcf86cd799439011';

const buildActiveAgent = () => ({
  id: AGENT_ID,
  name: 'Archive Me',
  category: 'utility',
  description: 'Done',
  rule: 'Follow policy',
  status: 'active',
  createdByAdminId: 'admin-1',
  updatedByAdminId: 'admin-1',
  removedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('removeSoft system agent command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set removedAt timestamp and archived status together', async () => {
    const removedAt = new Date('2026-04-01T11:30:00.000Z');
    mockGetModelById.mockResolvedValue({ data: buildActiveAgent() });
    mockRemoveSoft.mockResolvedValue({
      data: {
        ...buildActiveAgent(),
        status: 'archived',
        removedAt,
        updatedAt: removedAt,
        updatedByAdminId: 'admin-2',
      },
    });

    const result = await removeSoft({ id: AGENT_ID, updatedByAdminId: 'admin-2' });

    expect(result.data.removedAt).toEqual(removedAt);
    expect(result.data.status).toBe('archived');
    expect(result.data.updatedByAdminId).toBe('admin-2');
  });

  it('should throw NotFoundError when agent not found', async () => {
    mockGetModelById.mockRejectedValue(new NotFoundError('System agent not found'));

    await expect(removeSoft({ id: 'missing-id', updatedByAdminId: 'admin-1' })).rejects.toThrow(NotFoundError);
  });

  it('should reject archive when agent is already archived', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...buildActiveAgent(),
        status: 'archived',
        removedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });

    await expect(removeSoft({ id: AGENT_ID, updatedByAdminId: 'admin-1' })).rejects.toThrow(WrongParamError);
  });

  it('should reject removal when persistence fails unexpectedly', async () => {
    mockGetModelById.mockResolvedValue({ data: buildActiveAgent() });
    mockRemoveSoft.mockRejectedValue(new InternalError('Database unavailable'));

    await expect(removeSoft({ id: AGENT_ID, updatedByAdminId: 'admin-1' })).rejects.toThrow(InternalError);
  });
});
