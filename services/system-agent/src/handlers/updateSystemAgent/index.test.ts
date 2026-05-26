import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, NotFoundError } from '@vassembly/errors';
import {
  SYSTEM_AGENT_ERROR_CODES,
  throwSystemAgentNameConflictError,
} from '@vassembly/domain-system-agent';

const { mockAssertHasRole, mockGetById, mockAssertUniqueActiveName, mockUpdate } = vi.hoisted(() => ({
  mockAssertHasRole: vi.fn(),
  mockGetById: vi.fn(),
  mockAssertUniqueActiveName: vi.fn(),
  mockUpdate: vi.fn(),
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
      commands: {
        update: mockUpdate,
      },
      queries: {
        getById: mockGetById,
        assertUniqueActiveName: mockAssertUniqueActiveName,
      },
    },
  };
});

import { updateSystemAgent } from './index';

const EXISTING_AGENT = {
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

describe('updateSystemAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertHasRole.mockResolvedValue(undefined);
    mockGetById.mockResolvedValue({ data: EXISTING_AGENT });
    mockAssertUniqueActiveName.mockResolvedValue(undefined);
  });

  it('should return updated system agent when admin submits valid changes', async () => {
    mockUpdate.mockResolvedValue({
      data: {
        ...EXISTING_AGENT,
        name: 'Renamed Bot',
        updatedByAdminId: 'admin-1',
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });

    const result = await updateSystemAgent({
      adminUserId: 'admin-1',
      systemAgentId: 'sys-agent-1',
      body: { name: 'Renamed Bot' },
    });

    expect(result.systemAgent.name).toBe('Renamed Bot');
    expect(result.systemAgent.updatedByAdminId).toBe('admin-1');
  });

  it('should propagate name conflict when rename collides with another active agent', async () => {
    mockAssertUniqueActiveName.mockImplementation(() => {
      throwSystemAgentNameConflictError();
    });

    await expect(
      updateSystemAgent({
        adminUserId: 'admin-1',
        systemAgentId: 'sys-agent-1',
        body: { name: 'Taken Name' },
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      error: { code: SYSTEM_AGENT_ERROR_CODES.NAME_CONFLICT },
    });
  });

  it('should throw ForbiddenError when caller is not admin', async () => {
    mockAssertHasRole.mockRejectedValue(new ForbiddenError('Admin access required'));

    await expect(
      updateSystemAgent({
        adminUserId: 'user-1',
        systemAgentId: 'sys-agent-1',
        body: { name: 'Blocked' },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw NotFoundError when system agent does not exist', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('System agent not found'));

    await expect(
      updateSystemAgent({
        adminUserId: 'admin-1',
        systemAgentId: 'missing-id',
        body: { description: 'Updated' },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
