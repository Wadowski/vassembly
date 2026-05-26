import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, NotFoundError } from '@vassembly/errors';

const { mockAssertHasRole, mockGetById } = vi.hoisted(() => ({
  mockAssertHasRole: vi.fn(),
  mockGetById: vi.fn(),
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
        getById: mockGetById,
      },
    },
  };
});

import { getSystemAgent } from './index';

const ADMIN_AGENT_ROW = {
  id: 'sys-agent-1',
  name: 'Compliance Bot',
  rule: 'Help with compliance.',
  status: 'active' as const,
  createdByAdminId: 'admin-1',
  updatedByAdminId: 'admin-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  removedAt: null,
};

describe('getSystemAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertHasRole.mockResolvedValue(undefined);
  });

  it('should return admin system agent payload when admin requests by id', async () => {
    mockGetById.mockResolvedValue({ data: ADMIN_AGENT_ROW });

    const result = await getSystemAgent({
      adminUserId: 'admin-1',
      systemAgentId: 'sys-agent-1',
    });

    expect(result.systemAgent.id).toBe('sys-agent-1');
    expect(result.systemAgent.createdByAdminId).toBe('admin-1');
  });

  it('should throw ForbiddenError when caller is not admin', async () => {
    mockAssertHasRole.mockRejectedValue(new ForbiddenError('Admin access required'));

    await expect(
      getSystemAgent({
        adminUserId: 'user-1',
        systemAgentId: 'sys-agent-1',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw NotFoundError when system agent does not exist', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('System agent not found'));

    await expect(
      getSystemAgent({
        adminUserId: 'admin-1',
        systemAgentId: 'missing-id',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
