import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError } from '@vassembly/errors';
import { AgentStatus } from '@vassembly/domain-system-agent';

const { mockAssertHasRole, mockGetAdminList } = vi.hoisted(() => ({
  mockAssertHasRole: vi.fn(),
  mockGetAdminList: vi.fn(),
}));

vi.mock('@vassembly/domain-user', () => ({
  default: {
    queries: {
      assertHasRole: mockAssertHasRole,
    },
  },
}));

vi.mock('@vassembly/domain-system-agent', async () => {
  const domain = await import('../../../../../domains/system-agent/src/index.js');

  return {
    ...domain,
    default: {
      commands: {},
      queries: {
        getAdminList: mockGetAdminList,
      },
    },
  };
});

import { listSystemAgents } from './index';

describe('listSystemAgents handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertHasRole.mockResolvedValue(undefined);
  });

  it('should return paginated admin list when caller is admin', async () => {
    mockGetAdminList.mockResolvedValue({
      items: [
        {
          id: 'sys-agent-1',
          name: 'Compliance Bot',
          rule: 'Help',
          status: 'active',
          createdByAdminId: 'admin-1',
          updatedByAdminId: 'admin-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          removedAt: null,
        },
      ],
      totalCount: 1,
      page: 0,
      size: 20,
    });

    const result = await listSystemAgents({
      adminUserId: 'admin-1',
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.page).toBe(0);
    expect(result.size).toBe(20);
    expect(result.items[0]?.createdByAdminId).toBe('admin-1');
  });

  it('should return filtered paginated results when status and search are provided', async () => {
    mockGetAdminList.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      size: 5,
    });

    const result = await listSystemAgents({
      adminUserId: 'admin-1',
      status: AgentStatus.Archived,
      search: 'Compliance',
      page: 1,
      size: 5,
    });

    expect(result.page).toBe(1);
    expect(result.size).toBe(5);
    expect(result.items).toHaveLength(0);
  });

  it('should throw ForbiddenError when caller is not admin', async () => {
    mockAssertHasRole.mockRejectedValue(new ForbiddenError('Admin access required'));

    await expect(
      listSystemAgents({
        adminUserId: 'user-1',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should apply default pagination when page and size are omitted', async () => {
    mockGetAdminList.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 0,
      size: 20,
    });

    const result = await listSystemAgents({
      adminUserId: 'admin-1',
    });

    expect(result.page).toBe(0);
    expect(result.size).toBe(20);
  });
});
