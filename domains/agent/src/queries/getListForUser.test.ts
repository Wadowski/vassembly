import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

import { AgentCategory, AgentStatus, type AgentModel } from '../model';
import { AGENT_LIST_ALL_STATUSES } from './getListForUser.types';
import { getListForUser } from './getListForUser';

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

vi.mock('../clients', () => ({
  agentMongodbDao: {
    getManyRaw: mockGetManyRaw,
    collection: {
      countDocuments: mockCountDocuments,
    },
  },
}));

const doc = (partial: Partial<AgentModel & { id: string }>): Partial<AgentModel> => ({
  id: partial.id ?? 'a1',
  name: partial.name ?? 'Agent',
  category: partial.category ?? AgentCategory.Coding,
  description: partial.description ?? 'Desc',
  rule: partial.rule ?? 'Rule',
  userId: partial.userId ?? 'user-1',
  status: partial.status ?? AgentStatus.Active,
  removedAt: partial.removedAt ?? null,
  createdAt: partial.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: partial.updatedAt ?? new Date('2026-01-02T00:00:00.000Z'),
});

describe('getListForUser agent query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountDocuments.mockResolvedValue(0);
  });

  it('should default to active non-deleted agents for the user', async () => {
    mockGetManyRaw.mockResolvedValue([doc({ id: 'a1', status: AgentStatus.Active, removedAt: null })]);
    mockCountDocuments.mockResolvedValue(1);

    const result = await getListForUser({ userId: 'user-1', page: 0, size: 10 });

    expect(result.items.every((row) => row.status === AgentStatus.Active && row.removedAt === null)).toBe(true);
    expect(result.page).toBe(0);
    expect(result.size).toBe(10);
    expect(result.totalCount).toBe(1);
  });

  it('should return disabled agents that remain alive when status filter asks for disabled', async () => {
    mockGetManyRaw.mockResolvedValue([doc({ id: 'd1', status: AgentStatus.Disabled, removedAt: null })]);
    mockCountDocuments.mockResolvedValue(1);

    const result = await getListForUser({ userId: 'user-1', page: 0, size: 10, status: AgentStatus.Disabled });

    expect(result.items[0]?.status).toBe(AgentStatus.Disabled);
    expect(result.items[0]?.removedAt).toBeNull();
  });

  it('should include archived soft-deleted rows when archived filter selected', async () => {
    const removedAt = new Date('2026-03-01T00:00:00.000Z');
    mockGetManyRaw.mockResolvedValue([doc({ id: 'z1', status: AgentStatus.Archived, removedAt })]);
    mockCountDocuments.mockResolvedValue(1);

    const result = await getListForUser({ userId: 'user-1', page: 0, size: 10, status: AgentStatus.Archived });

    expect(result.items[0]?.status).toBe(AgentStatus.Archived);
    expect(result.items[0]?.removedAt).not.toBeNull();
  });

  it('should include agents across every status when all filter selected', async () => {
    const removedAt = new Date('2026-03-01T00:00:00.000Z');
    mockGetManyRaw.mockResolvedValue([
      doc({ id: 'a1', status: AgentStatus.Active, removedAt: null }),
      doc({ id: 'd1', status: AgentStatus.Disabled, removedAt: null }),
      doc({ id: 'z1', status: AgentStatus.Archived, removedAt }),
    ]);
    mockCountDocuments.mockResolvedValue(3);

    const result = await getListForUser({ userId: 'user-1', page: 0, size: 10, status: AGENT_LIST_ALL_STATUSES });

    expect(result.items).toHaveLength(3);
    expect(mockGetManyRaw).toHaveBeenCalledWith(
      { $and: [{ userId: 'user-1' }] },
      expect.objectContaining({ offset: 0, limit: 10 }),
    );
  });

  it('should apply pagination windows using page and size', async () => {
    mockGetManyRaw.mockResolvedValue(Array.from({ length: 5 }).map((_, idx) => doc({ id: `page1-${idx}` })));
    mockCountDocuments.mockResolvedValue(47);

    const result = await getListForUser({ userId: 'user-1', page: 2, size: 5 });

    expect(result.items).toHaveLength(5);
    expect(result.totalCount).toBe(47);
    expect(result.page).toBe(2);
    expect(result.size).toBe(5);
  });

  it('should honor search matches against name and description only', async () => {
    mockGetManyRaw.mockResolvedValue([
      doc({
        id: 'match-name',
        name: 'Invoice Parser',
        description: 'Handles PDFs',
      }),
    ]);
    mockCountDocuments.mockResolvedValue(1);

    const result = await getListForUser({ userId: 'user-1', page: 0, size: 10, search: 'Invoice' });

    expect(result.items.some((row) => row.name?.includes('Invoice'))).toBe(true);
  });

  it('should not surface agents owned by another user', async () => {
    mockGetManyRaw.mockResolvedValue([]);
    mockCountDocuments.mockResolvedValue(0);

    const result = await getListForUser({ userId: 'user-99', page: 0, size: 10 });

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it('should reject invalid pagination parameters before querying MongoDB', async () => {
    await expect(getListForUser({ userId: 'user-1', page: -1, size: 10 })).rejects.toThrow(ValidationError);
  });

  it('should cap page size to service maximum', async () => {
    mockGetManyRaw.mockResolvedValue([]);
    mockCountDocuments.mockResolvedValue(0);

    const result = await getListForUser({ userId: 'user-1', page: 0, size: 999 });

    expect(result.size).toBeLessThanOrEqual(50);
  });
});
