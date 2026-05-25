import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, NotFoundError } from '@vassembly/errors';
import { AuthTokenRole } from '@vassembly/domain-auth-token';

const { mockGetById, mockRemoveSoft } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockRemoveSoft: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', async () => {
  const domain = await import('../../../../../domains/system-agent/src/index.js');

  return {
    ...domain,
    default: {
      commands: {
        removeSoft: mockRemoveSoft,
      },
      queries: {
        getById: mockGetById,
      },
    },
  };
});

import { archiveSystemAgent } from './index';

const ACTIVE_AGENT = {
  id: 'sys-agent-1',
  name: 'Compliance Bot',
  rule: 'Help',
  status: 'active' as const,
  createdByAdminId: 'admin-1',
  updatedByAdminId: 'admin-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  removedAt: null,
};

describe('archiveSystemAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetById.mockResolvedValue({ data: ACTIVE_AGENT });
  });

  it('should return archived system agent when admin archives active agent', async () => {
    mockRemoveSoft.mockResolvedValue({
      data: {
        ...ACTIVE_AGENT,
        status: 'archived',
        removedAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedByAdminId: 'admin-1',
      },
    });

    const result = await archiveSystemAgent({
      adminUserId: 'admin-1',
      role: AuthTokenRole.ADMIN,
      systemAgentId: 'sys-agent-1',
    });

    expect(result.systemAgent.status).toBe('archived');
    expect(result.systemAgent.removedAt).not.toBeNull();
  });

  it('should succeed idempotently when system agent is already archived', async () => {
    mockGetById.mockResolvedValue({
      data: {
        ...ACTIVE_AGENT,
        status: 'archived',
        removedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });
    mockRemoveSoft.mockResolvedValue({
      data: {
        ...ACTIVE_AGENT,
        status: 'archived',
        removedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });

    const result = await archiveSystemAgent({
      adminUserId: 'admin-1',
      role: AuthTokenRole.ADMIN,
      systemAgentId: 'sys-agent-1',
    });

    expect(result.systemAgent.status).toBe('archived');
  });

  it('should throw ForbiddenError when caller is not admin', async () => {
    await expect(
      archiveSystemAgent({
        adminUserId: 'user-1',
        role: AuthTokenRole.USER,
        systemAgentId: 'sys-agent-1',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw NotFoundError when system agent does not exist', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('System agent not found'));

    await expect(
      archiveSystemAgent({
        adminUserId: 'admin-1',
        role: AuthTokenRole.ADMIN,
        systemAgentId: 'missing-id',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
