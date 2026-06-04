import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CacheBackend } from '@vassembly/config';
import { initCache, resetCacheStoreForTests } from '@vassembly/cache';
import { NotFoundError, WrongParamError } from '@vassembly/errors';

import { AgentCategory, AgentStatus } from '../../constants';

import type { SystemAgentModel } from '../../model';
import { getActiveByName } from './index';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetRaw } = vi.hoisted(() => ({
  mockGetRaw: vi.fn(),
}));

vi.mock('../../clients', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../clients')>();
  return {
    ...actual,
    systemAgentMongodbDao: {
      getRaw: mockGetRaw,
    },
  };
});

const AGENT_ID = '507f1f77bcf86cd799439011';

const buildAgentRow = (
  overrides: Partial<SystemAgentModel & { id: string }> = {},
): Partial<SystemAgentModel> & { id: string } => ({
  id: overrides.id ?? AGENT_ID,
  name: overrides.name ?? 'Assistant',
  rule: overrides.rule ?? 'Help users',
  category: overrides.category ?? AgentCategory.Onboarding,
  description: overrides.description ?? 'Default assistant',
  status: overrides.status ?? AgentStatus.Active,
  removedAt: overrides.removedAt ?? null,
  createdByAdminId: overrides.createdByAdminId ?? 'admin-1',
  updatedByAdminId: overrides.updatedByAdminId ?? 'admin-1',
  createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: overrides.updatedAt ?? new Date('2026-01-02T00:00:00.000Z'),
});

describe('getActiveByName system agent query', () => {
  beforeEach(async () => {
    resetCacheStoreForTests();
    await initCache({ backend: CacheBackend.Memory, defaultTtlMs: 60_000 });
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetCacheStoreForTests();
  });

  it('should load from database and cache result on miss', async () => {
    mockGetRaw.mockResolvedValue(buildAgentRow({ name: 'Assistant' }));

    const first = await getActiveByName({ name: 'Assistant' });
    const second = await getActiveByName({ name: 'assistant' });

    expect(first.data.id).toBe(AGENT_ID);
    expect(second.data.id).toBe(AGENT_ID);
    expect(mockGetRaw).toHaveBeenCalledTimes(1);
  });

  it('should return cached agent without querying database on hit', async () => {
    mockGetRaw.mockResolvedValue(buildAgentRow({ name: 'Compliance Bot' }));

    await getActiveByName({ name: 'Compliance Bot' });
    mockGetRaw.mockClear();

    const cached = await getActiveByName({ name: 'compliance bot' });

    expect(cached.data.name).toBe('Compliance Bot');
    expect(mockGetRaw).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when no active agent exists', async () => {
    mockGetRaw.mockResolvedValue(undefined);

    await expect(getActiveByName({ name: 'Missing Agent' })).rejects.toThrow(NotFoundError);
  });

  it('should reject validation when name is empty after trim', async () => {
    await expect(getActiveByName({ name: '   ' })).rejects.toThrow(WrongParamError);
  });
});
