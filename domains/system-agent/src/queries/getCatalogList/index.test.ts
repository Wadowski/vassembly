import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WrongParamError } from '@vassembly/errors';
import { AgentCategory, AgentStatus } from '../../constants';

import type { SystemAgentModel } from '../../model';
import { getCatalogList } from './index';

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
  systemAgentMongodbDao: {
    getManyRaw: mockGetManyRaw,
    collection: {
      countDocuments: mockCountDocuments,
    },
  },
}));

const doc = (partial: Partial<SystemAgentModel & { id: string }>): Partial<SystemAgentModel> => ({
  id: partial.id ?? 'sa-1',
  name: partial.name ?? 'Platform Agent',
  category: partial.category ?? AgentCategory.Coding,
  description: partial.description ?? 'Helps users',
  rule: partial.rule ?? 'Be helpful',
  status: partial.status ?? AgentStatus.Active,
  removedAt: partial.removedAt ?? null,
  createdByAdminId: partial.createdByAdminId ?? 'admin-1',
  updatedByAdminId: partial.updatedByAdminId ?? 'admin-1',
  createdAt: partial.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: partial.updatedAt ?? new Date('2026-01-02T00:00:00.000Z'),
});

describe('getCatalogList system agent query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountDocuments.mockResolvedValue(0);
  });

  it('should return only active agents with removedAt null', async () => {
    mockGetManyRaw.mockResolvedValue([
      doc({ id: 'sa-active', status: AgentStatus.Active, removedAt: null }),
    ]);
    mockCountDocuments.mockResolvedValue(1);

    const result = await getCatalogList({ page: 0, size: 10 });

    expect(result.items.every((row) => row.status === AgentStatus.Active && row.removedAt === null)).toBe(true);
    expect(result.totalCount).toBe(1);
  });

  it('should return empty catalog when no active agents exist', async () => {
    mockGetManyRaw.mockResolvedValue([]);
    mockCountDocuments.mockResolvedValue(0);

    const result = await getCatalogList({ page: 0, size: 10 });

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it('should apply pagination using page and size', async () => {
    mockGetManyRaw.mockResolvedValue(Array.from({ length: 5 }).map((_, index) => doc({ id: `sa-${index}` })));
    mockCountDocuments.mockResolvedValue(42);

    const result = await getCatalogList({ page: 2, size: 5 });

    expect(result.items).toHaveLength(5);
    expect(result.page).toBe(2);
    expect(result.size).toBe(5);
    expect(result.totalCount).toBe(42);
  });

  it('should honor search matches against name and description', async () => {
    mockGetManyRaw.mockResolvedValue([
      doc({
        id: 'sa-search',
        name: 'Invoice Parser',
        description: 'Handles PDF invoices',
      }),
    ]);
    mockCountDocuments.mockResolvedValue(1);

    const result = await getCatalogList({ page: 0, size: 10, search: 'Invoice' });

    expect(result.items.some((row) => row.name?.includes('Invoice'))).toBe(true);
  });

  it('should reject invalid pagination parameters before querying MongoDB', async () => {
    await expect(getCatalogList({ page: -1, size: 10 })).rejects.toThrow(WrongParamError);
  });
});
