import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError, ValidationError } from '@vassembly/errors';

import { AgentCategory, AgentStatus, type AgentModel } from '../../model';
import { assertUniqueNameForUser } from './index';

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
  agentMongodbDao: {
    getRaw: mockGetRaw,
  },
}));

const USER_ID = 'user-1';
const EXISTING_ID = '507f1f77bcf86cd799439011';

const buildAgent = (
  overrides: Partial<AgentModel & { id: string }> = {},
): Partial<AgentModel> & { id: string } => ({
  id: overrides.id ?? EXISTING_ID,
  userId: overrides.userId ?? USER_ID,
  name: overrides.name ?? 'Review Bot',
  category: overrides.category ?? AgentCategory.Coding,
  description: overrides.description ?? 'Helps with reviews',
  rule: overrides.rule ?? 'Stay concise',
  status: overrides.status ?? AgentStatus.Active,
  removedAt: overrides.removedAt ?? null,
  createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: overrides.updatedAt ?? new Date('2026-01-02T00:00:00.000Z'),
});

describe('assertUniqueNameForUser personal agent query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve when no conflicting active agent name exists for the user', async () => {
    mockGetRaw.mockResolvedValue(undefined);

    await expect(
      assertUniqueNameForUser({ userId: USER_ID, name: 'Unique Agent' }),
    ).resolves.toBeUndefined();
  });

  it('should throw ConflictError when active agent with same name exists for the user', async () => {
    mockGetRaw.mockResolvedValue(buildAgent({ name: 'Review Bot' }));

    await expect(
      assertUniqueNameForUser({ userId: USER_ID, name: 'Review Bot' }),
    ).rejects.toThrow(ConflictError);
  });

  it('should throw ConflictError when name differs only by case from an active agent for the user', async () => {
    mockGetRaw.mockResolvedValue(buildAgent({ name: 'Review Bot' }));

    await expect(
      assertUniqueNameForUser({ userId: USER_ID, name: 'review bot' }),
    ).rejects.toThrow(ConflictError);
  });

  it('should allow same name when excludeId matches the existing agent during update', async () => {
    mockGetRaw.mockResolvedValue(undefined);

    await expect(
      assertUniqueNameForUser({
        userId: USER_ID,
        name: 'Review Bot',
        excludeId: EXISTING_ID,
      }),
    ).resolves.toBeUndefined();
  });

  it('should resolve when only archived or disabled agents share the name for the user', async () => {
    mockGetRaw.mockResolvedValue(undefined);

    await expect(
      assertUniqueNameForUser({ userId: USER_ID, name: 'Retired Bot' }),
    ).resolves.toBeUndefined();
  });

  it('should resolve when another user already has an active agent with the same name', async () => {
    mockGetRaw.mockResolvedValue(undefined);

    await expect(
      assertUniqueNameForUser({ userId: 'user-2', name: 'Review Bot' }),
    ).resolves.toBeUndefined();
  });

  it('should reject validation when name is empty after trim', async () => {
    await expect(
      assertUniqueNameForUser({ userId: USER_ID, name: '   ' }),
    ).rejects.toThrow(ValidationError);
  });
});
