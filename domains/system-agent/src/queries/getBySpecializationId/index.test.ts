import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WrongParamError } from '@vassembly/errors';

import { AgentCategory, AgentStatus } from '../../constants';
import type { SystemAgentModel } from '../../model';
import { getBySpecializationId } from './index';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetManyRaw } = vi.hoisted(() => ({
  mockGetManyRaw: vi.fn(),
}));

vi.mock('../../clients', () => ({
  systemAgentMongodbDao: {
    getManyRaw: mockGetManyRaw,
  },
}));

const SPECIALIZATION_ID = '507f1f77bcf86cd799439099';

const buildAgentRow = (
  overrides: Partial<SystemAgentModel & { id: string }> = {},
): Partial<SystemAgentModel> & { id: string } => ({
  id: overrides.id ?? '507f1f77bcf86cd799439011',
  name: overrides.name ?? 'Researcher',
  rule: overrides.rule ?? 'Research tasks',
  category: overrides.category ?? AgentCategory.Coding,
  description: overrides.description ?? 'Research agent',
  status: overrides.status ?? AgentStatus.Active,
  removedAt: overrides.removedAt ?? null,
  createdByAdminId: overrides.createdByAdminId ?? 'admin-1',
  updatedByAdminId: overrides.updatedByAdminId ?? 'admin-1',
  createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: overrides.updatedAt ?? new Date('2026-01-02T00:00:00.000Z'),
  assignedToolIds: overrides.assignedToolIds ?? [],
  specializationId: overrides.specializationId ?? SPECIALIZATION_ID,
});

describe('getBySpecializationId system agent query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return agents for the given specializationId ordered by name', async () => {
    mockGetManyRaw.mockResolvedValue([
      buildAgentRow({ id: 'agent-1', name: 'Researcher' }),
      buildAgentRow({ id: 'agent-2', name: 'Validator' }),
      buildAgentRow({ id: 'agent-3', name: 'Worker' }),
    ]);

    const result = await getBySpecializationId({ specializationId: SPECIALIZATION_ID });

    expect(result.items).toHaveLength(3);
    expect(result.items[0]?.name).toBe('Researcher');
    expect(result.items[1]?.name).toBe('Validator');
    expect(result.items[2]?.name).toBe('Worker');
    expect(mockGetManyRaw).toHaveBeenCalledWith(
      { specializationId: SPECIALIZATION_ID },
      { sort: { name: 1 } },
    );
  });

  it('should return empty items when no agents match specializationId', async () => {
    mockGetManyRaw.mockResolvedValue([]);

    const result = await getBySpecializationId({ specializationId: SPECIALIZATION_ID });

    expect(result.items).toEqual([]);
  });

  it('should reject validation when specializationId is empty', async () => {
    await expect(getBySpecializationId({ specializationId: '' })).rejects.toThrow(WrongParamError);
  });
});
