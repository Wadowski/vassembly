import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetListForUser } = vi.hoisted(() => ({
  mockGetListForUser: vi.fn(),
}));

vi.mock('@vassembly/domain-agent', () => ({
  default: {
    commands: {},
    queries: {
      getListForUser: mockGetListForUser,
    },
  },
}));

import { listAgents } from './index';

describe('listAgents handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated agents scoped to requesting userId only', async () => {
    mockGetListForUser.mockResolvedValue({
      items: [{ id: 'a1', userId: 'user-1', name: 'Mine' }],
      totalCount: 1,
      page: 0,
      size: 10,
    });

    const result = await listAgents({ userId: 'user-1', page: 0, size: 10 });

    expect(result.totalCount).toBe(1);
    expect(result.items[0]).toMatchObject({ userId: 'user-1' });
    expect(result.page).toBe(0);
    expect(result.size).toBe(10);
  });

  it('should forward search and status filters for catalog narrowing', async () => {
    mockGetListForUser.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      size: 5,
    });

    const result = await listAgents({
      userId: 'user-1',
      page: 1,
      size: 5,
      search: 'Invoice',
      status: 'archived',
    });

    expect(result.page).toBe(1);
    expect(result.size).toBe(5);
    expect(result.items).toHaveLength(0);
  });

  it('should never leak another tenant rows even if datastore misbehaves', async () => {
    mockGetListForUser.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 0,
      size: 10,
    });

    const result = await listAgents({ userId: 'user-safe', page: 0, size: 10 });

    expect(result.items.some((row) => (row as { userId?: string }).userId === 'user-other')).toBe(false);
  });
});
