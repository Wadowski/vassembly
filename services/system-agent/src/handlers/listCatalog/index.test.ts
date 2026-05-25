import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AgentCategory } from '@vassembly/domain-system-agent';

const { mockGetCatalogList } = vi.hoisted(() => ({
  mockGetCatalogList: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', async () => {
  const domain = await import('../../../../../domains/system-agent/src/index.js');

  return {
    ...domain,
    default: {
      commands: {},
      queries: {
        getCatalogList: mockGetCatalogList,
      },
    },
  };
});

import { listCatalog } from './index';

const CATALOG_ROW = {
  id: 'sys-agent-1',
  name: 'Compliance Bot',
  description: 'Helps with compliance',
  category: AgentCategory.Compliance,
  status: 'active' as const,
  rule: 'Hidden in list mapping',
  createdByAdminId: 'admin-1',
  updatedByAdminId: 'admin-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  removedAt: null,
};

describe('listCatalog handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return active catalog items for authenticated user', async () => {
    mockGetCatalogList.mockResolvedValue({
      items: [CATALOG_ROW],
      totalCount: 1,
      page: 0,
      size: 20,
    });

    const result = await listCatalog({ userId: 'user-1' });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe('active');
  });

  it('should return case-insensitive search matches when search is provided', async () => {
    mockGetCatalogList.mockResolvedValue({
      items: [{ ...CATALOG_ROW, name: 'COMPLIANCE BOT' }],
      totalCount: 1,
      page: 0,
      size: 20,
    });

    const result = await listCatalog({
      userId: 'user-1',
      search: 'compliance',
    });

    expect(result.items[0]?.name).toBe('COMPLIANCE BOT');
  });

  it('should return filtered items when category filter is provided', async () => {
    mockGetCatalogList.mockResolvedValue({
      items: [CATALOG_ROW],
      totalCount: 1,
      page: 0,
      size: 20,
    });

    const result = await listCatalog({
      userId: 'user-1',
      category: AgentCategory.Compliance,
    });

    expect(result.items[0]?.category).toBe(AgentCategory.Compliance);
  });

  it('should omit audit fields from catalog list items', async () => {
    mockGetCatalogList.mockResolvedValue({
      items: [CATALOG_ROW],
      totalCount: 1,
      page: 0,
      size: 20,
    });

    const result = await listCatalog({ userId: 'user-1' });
    const item = result.items[0];

    expect('createdByAdminId' in item!).toBe(false);
    expect('updatedByAdminId' in item!).toBe(false);
    expect('createdAt' in item!).toBe(false);
    expect('updatedAt' in item!).toBe(false);
    expect('removedAt' in item!).toBe(false);
  });

  it('should omit rule from catalog list items', async () => {
    mockGetCatalogList.mockResolvedValue({
      items: [CATALOG_ROW],
      totalCount: 1,
      page: 0,
      size: 20,
    });

    const result = await listCatalog({ userId: 'user-1' });
    const item = result.items[0];

    expect('rule' in item!).toBe(false);
  });
});
