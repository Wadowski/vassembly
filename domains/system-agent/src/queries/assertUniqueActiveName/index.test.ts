import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError, ValidationError } from '@vassembly/errors';
import { AgentCategory, AgentStatus } from '../../constants';

import type { SystemAgentModel } from '../../model';
import { assertUniqueActiveName } from './index';

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

vi.mock('../../clients', () => ({
  systemAgentMongodbDao: {
    getRaw: mockGetRaw,
  },
}));

const EXISTING_ID = '507f1f77bcf86cd799439011';

const buildAgent = (
  overrides: Partial<SystemAgentModel & { id: string }> = {},
): Partial<SystemAgentModel> & { id: string } => ({
  id: overrides.id ?? EXISTING_ID,
  name: overrides.name ?? 'Compliance Bot',
  rule: overrides.rule ?? 'Follow policy',
  category: overrides.category ?? AgentCategory.Compliance,
  description: overrides.description ?? 'Helps with compliance',
  status: overrides.status ?? AgentStatus.Active,
  removedAt: overrides.removedAt ?? null,
  createdByAdminId: overrides.createdByAdminId ?? 'admin-1',
  updatedByAdminId: overrides.updatedByAdminId ?? 'admin-1',
  createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: overrides.updatedAt ?? new Date('2026-01-02T00:00:00.000Z'),
});

describe('assertUniqueActiveName system agent query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve when no conflicting active agent name exists', async () => {
    mockGetRaw.mockResolvedValue(undefined);

    await expect(assertUniqueActiveName({ name: 'Unique Agent' })).resolves.toBeUndefined();
  });

  it('should throw ConflictError when active agent with same name exists', async () => {
    mockGetRaw.mockResolvedValue(buildAgent({ name: 'Compliance Bot' }));

    await expect(assertUniqueActiveName({ name: 'Compliance Bot' })).rejects.toThrow(ConflictError);
  });

  it('should throw ConflictError when name differs only by case from active agent', async () => {
    mockGetRaw.mockResolvedValue(buildAgent({ name: 'Compliance Bot' }));

    await expect(assertUniqueActiveName({ name: 'compliance bot' })).rejects.toThrow(ConflictError);
  });

  it('should allow same name when excludeId matches the existing agent during update', async () => {
    mockGetRaw.mockResolvedValue(undefined);

    await expect(
      assertUniqueActiveName({
        name: 'Compliance Bot',
        excludeId: EXISTING_ID,
      }),
    ).resolves.toBeUndefined();
  });

  it('should resolve when only archived or disabled agents share the name', async () => {
    mockGetRaw.mockResolvedValue(undefined);

    await expect(assertUniqueActiveName({ name: 'Retired Bot' })).resolves.toBeUndefined();
  });

  it('should reject validation when name is empty after trim', async () => {
    await expect(assertUniqueActiveName({ name: '   ' })).rejects.toThrow(ValidationError);
  });
});
