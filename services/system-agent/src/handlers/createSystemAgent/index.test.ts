import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, ValidationError } from '@vassembly/errors';
import { AuthTokenRole } from '@vassembly/domain-auth-token';
import {
  AgentCategory,
  SYSTEM_AGENT_ERROR_CODES,
  throwSystemAgentNameConflictError,
} from '@vassembly/domain-system-agent';

const { mockAssertUniqueActiveName, mockCreate } = vi.hoisted(() => ({
  mockAssertUniqueActiveName: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', async () => {
  const domain = await import('../../../../../domains/system-agent/src/index.js');

  return {
    ...domain,
    default: {
      commands: {
        create: mockCreate,
      },
      queries: {
        assertUniqueActiveName: mockAssertUniqueActiveName,
      },
    },
  };
});

import { createSystemAgent } from './index';

const CREATE_BODY = {
  name: 'Compliance Bot',
  rule: 'You help with compliance tasks.',
  description: 'Enterprise compliance assistant',
  category: AgentCategory.Compliance,
};

const ADMIN_AGENT_ROW = {
  id: 'sys-agent-1',
  ...CREATE_BODY,
  status: 'active' as const,
  createdByAdminId: 'admin-1',
  updatedByAdminId: 'admin-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  removedAt: null,
};

describe('createSystemAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertUniqueActiveName.mockResolvedValue(undefined);
  });

  it('should return created system agent when admin submits valid payload', async () => {
    mockCreate.mockResolvedValue({ data: ADMIN_AGENT_ROW });

    const result = await createSystemAgent({
      adminUserId: 'admin-1',
      role: AuthTokenRole.ADMIN,
      body: CREATE_BODY,
    });

    expect(result.systemAgent.id).toBe('sys-agent-1');
    expect(result.systemAgent.name).toBe(CREATE_BODY.name);
    expect(result.systemAgent.createdByAdminId).toBe('admin-1');
    expect(result.systemAgent.updatedByAdminId).toBe('admin-1');
  });

  it('should throw ForbiddenError when caller is not admin', async () => {
    await expect(
      createSystemAgent({
        adminUserId: 'user-1',
        role: AuthTokenRole.USER,
        body: CREATE_BODY,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should propagate name conflict as 409 when active agent name already exists', async () => {
    mockAssertUniqueActiveName.mockImplementation(() => {
      throwSystemAgentNameConflictError();
    });

    await expect(
      createSystemAgent({
        adminUserId: 'admin-1',
        role: AuthTokenRole.ADMIN,
        body: CREATE_BODY,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      error: { code: SYSTEM_AGENT_ERROR_CODES.NAME_CONFLICT },
    });
  });

  it('should surface validation failures when field lengths are invalid', async () => {
    mockCreate.mockRejectedValue(new ValidationError('name too long'));

    await expect(
      createSystemAgent({
        adminUserId: 'admin-1',
        role: AuthTokenRole.ADMIN,
        body: {
          ...CREATE_BODY,
          name: 'x'.repeat(101),
        },
      }),
    ).rejects.toThrow(ValidationError);
  });
});
