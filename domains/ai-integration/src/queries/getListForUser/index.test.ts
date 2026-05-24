import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WrongParamError } from '@vassembly/errors';

import { AiIntegrationProvider, AiIntegrationStatus } from '../../constants';
import type { AiIntegrationCredentialModel } from '../../model';
import { AI_INTEGRATION_LIST_ALL_STATUSES } from './types';
import { getListForUser } from './index';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetManyRaw, mockCountDocuments } = vi.hoisted(() => ({
  mockGetManyRaw: vi.fn(),
  mockCountDocuments: vi.fn(),
}));

vi.mock('../../clients', () => ({
  aiIntegrationMongodbDao: {
    getManyRaw: mockGetManyRaw,
    collection: {
      countDocuments: mockCountDocuments,
    },
  },
}));

const doc = (partial: Partial<AiIntegrationCredentialModel & { id: string }>): Partial<AiIntegrationCredentialModel> => ({
  id: partial.id ?? 'c1',
  name: partial.name ?? 'Gemini',
  provider: partial.provider ?? AiIntegrationProvider.Gemini,
  userId: partial.userId ?? 'user-1',
  status: partial.status ?? AiIntegrationStatus.Active,
  connectionStatus: partial.connectionStatus ?? 'connected',
  removedAt: partial.removedAt ?? null,
  createdAt: partial.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: partial.updatedAt ?? new Date('2026-01-02T00:00:00.000Z'),
});

describe('getListForUser ai integration query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountDocuments.mockResolvedValue(0);
  });

  it('should default to active non-deleted credentials for the user', async () => {
    mockGetManyRaw.mockResolvedValue([doc({ id: 'c1', status: AiIntegrationStatus.Active, removedAt: null })]);
    mockCountDocuments.mockResolvedValue(1);

    const result = await getListForUser({ userId: 'user-1', page: 0, size: 10 });

    expect(result.items.every((row) => row.status === AiIntegrationStatus.Active && row.removedAt === null)).toBe(true);
    expect(result.totalCount).toBe(1);
  });

  it('should filter by provider when provider filter supplied', async () => {
    mockGetManyRaw.mockResolvedValue([doc({ id: 'c2', provider: AiIntegrationProvider.ChatGpt })]);
    mockCountDocuments.mockResolvedValue(1);

    const result = await getListForUser({
      userId: 'user-1',
      page: 0,
      size: 10,
      provider: AiIntegrationProvider.ChatGpt,
    });

    expect(result.items[0]?.provider).toBe(AiIntegrationProvider.ChatGpt);
  });

  it('should include archived credentials when archived filter selected', async () => {
    const removedAt = new Date('2026-03-01T00:00:00.000Z');
    mockGetManyRaw.mockResolvedValue([doc({ id: 'c3', status: AiIntegrationStatus.Archived, removedAt })]);
    mockCountDocuments.mockResolvedValue(1);

    const result = await getListForUser({
      userId: 'user-1',
      page: 0,
      size: 10,
      status: AiIntegrationStatus.Archived,
    });

    expect(result.items[0]?.status).toBe(AiIntegrationStatus.Archived);
  });

  it('should reject invalid pagination input', async () => {
    await expect(getListForUser({ userId: 'user-1', page: -1, size: 10 })).rejects.toThrow(WrongParamError);
  });

  it('should accept all statuses filter value', async () => {
    mockGetManyRaw.mockResolvedValue([
      doc({ id: 'c4', status: AiIntegrationStatus.Active }),
      doc({ id: 'c5', status: AiIntegrationStatus.Disabled }),
    ]);
    mockCountDocuments.mockResolvedValue(2);

    const result = await getListForUser({
      userId: 'user-1',
      page: 0,
      size: 10,
      status: AI_INTEGRATION_LIST_ALL_STATUSES,
    });

    expect(result.items).toHaveLength(2);
  });
});
