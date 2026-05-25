import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, WrongParamError } from '@vassembly/errors';
import { AuthTokenRole } from '@vassembly/domain-auth-token';

const { mockGetById, mockRestore } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockRestore: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', async () => {
  const domain = await import('../../../../../domains/system-agent/src/index.js');

  return {
    ...domain,
    default: {
      commands: {
        restore: mockRestore,
      },
      queries: {
        getById: mockGetById,
      },
    },
  };
});

import { restoreSystemAgent } from './index';

describe('restoreSystemAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return active system agent when admin restores archived agent', async () => {
    mockGetById.mockResolvedValue({
      data: {
        id: 'sys-agent-1',
        name: 'Compliance Bot',
        rule: 'Help',
        status: 'archived',
        removedAt: new Date('2026-03-01T00:00:00.000Z'),
        createdByAdminId: 'admin-1',
        updatedByAdminId: 'admin-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });
    mockRestore.mockResolvedValue({
      data: {
        id: 'sys-agent-1',
        name: 'Compliance Bot',
        rule: 'Help',
        status: 'active',
        removedAt: null,
        createdByAdminId: 'admin-1',
        updatedByAdminId: 'admin-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-01T00:00:00.000Z'),
      },
    });

    const result = await restoreSystemAgent({
      adminUserId: 'admin-1',
      role: AuthTokenRole.ADMIN,
      systemAgentId: 'sys-agent-1',
    });

    expect(result.systemAgent.status).toBe('active');
    expect(result.systemAgent.removedAt).toBeNull();
  });

  it('should throw WrongParamError when system agent is not archived', async () => {
    mockGetById.mockResolvedValue({
      data: {
        id: 'sys-agent-live',
        name: 'Live Bot',
        rule: 'Help',
        status: 'active',
        removedAt: null,
        createdByAdminId: 'admin-1',
        updatedByAdminId: 'admin-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    });

    await expect(
      restoreSystemAgent({
        adminUserId: 'admin-1',
        role: AuthTokenRole.ADMIN,
        systemAgentId: 'sys-agent-live',
      }),
    ).rejects.toThrow(WrongParamError);
  });

  it('should throw ForbiddenError when caller is not admin', async () => {
    await expect(
      restoreSystemAgent({
        adminUserId: 'user-1',
        role: AuthTokenRole.USER,
        systemAgentId: 'sys-agent-1',
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
