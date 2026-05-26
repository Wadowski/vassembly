import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, NotFoundError, TimeoutError } from '@vassembly/errors';
import { AuthTokenRole } from '@vassembly/domain-auth-token';
import {
  AiIntegrationConnectionStatus,
  AiIntegrationStatus,
} from '@vassembly/domain-ai-integration';
import {
  SYSTEM_AGENT_ERROR_CODES,
  throwSystemAgentConnectionInvalidError,
  throwSystemAgentConnectionRequiredError,
} from '@vassembly/domain-system-agent';

const {
  mockInvoke,
  mockGetActiveById,
  mockResolveAndBuildClient,
} = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  mockGetActiveById: vi.fn(),
  mockResolveAndBuildClient: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', async () => {
  const domain = await import('../../../../../domains/system-agent/src/index.js');

  return {
    ...domain,
    default: {
      commands: {
        invoke: mockInvoke,
      },
      queries: {
        getActiveById: mockGetActiveById,
      },
    },
  };
});

vi.mock('@vassembly/domain-ai-integration', async () => {
  const domain = await import('../../../../../domains/ai-integration/src/index.js');

  return {
    ...domain,
    default: {
      commands: {
        resolveAndBuildClient: mockResolveAndBuildClient,
      },
      queries: domain.queries,
    },
  };
});

import { invokeSystemAgent } from './index';

const MODELED_CLIENT = {
  invoke: vi.fn(),
};

describe('invokeSystemAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActiveById.mockResolvedValue({
      data: {
        id: 'sys-agent-1',
        name: 'Compliance Bot',
        rule: 'You help with compliance.',
        status: 'active',
        removedAt: null,
      },
    });
    mockResolveAndBuildClient.mockResolvedValue(MODELED_CLIENT);
    mockInvoke.mockResolvedValue({
      message: 'Here is a summary.',
      usage: { promptTokens: 120, completionTokens: 80, totalTokens: 200 },
      metadata: { model: 'gpt-4', provider: 'chatgpt' },
    });
  });

  it('should resolve credential invoke agent and return provider message', async () => {
    const result = await invokeSystemAgent({
      userId: 'admin-1',
      role: AuthTokenRole.ADMIN,
      systemAgentId: 'sys-agent-1',
      message: 'Summarize our Q1 compliance checklist.',
    });

    expect(result.message).toBe('Here is a summary.');
    expect(result.usage?.totalTokens).toBe(200);
    expect(result.metadata?.provider).toBe('chatgpt');
  });

  it('should use admin override credential when admin invokes with connectionOverride', async () => {
    const result = await invokeSystemAgent({
      userId: 'admin-1',
      role: AuthTokenRole.ADMIN,
      systemAgentId: 'sys-agent-1',
      message: 'Hello',
      connectionOverride: { integrationCredentialId: 'cred-admin' },
    });

    expect(mockResolveAndBuildClient).toHaveBeenCalledWith({
      userId: 'admin-1',
      role: AuthTokenRole.ADMIN,
      connectionOverride: { integrationCredentialId: 'cred-admin' },
    });
    expect(result.message).toBe('Here is a summary.');
  });

  it('should throw ForbiddenError when caller is not admin', async () => {
    await expect(
      invokeSystemAgent({
        userId: 'user-1',
        role: AuthTokenRole.USER,
        systemAgentId: 'sys-agent-1',
        message: 'Hello',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError when non-admin sends connectionOverride', async () => {
    await expect(
      invokeSystemAgent({
        userId: 'user-1',
        role: AuthTokenRole.USER,
        systemAgentId: 'sys-agent-1',
        message: 'Hello',
        connectionOverride: { integrationCredentialId: 'cred-other' },
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      error: { code: 'CONNECTION_OVERRIDE_FORBIDDEN' },
    });
  });

  it('should throw connection required error when user has no preference', async () => {
    mockResolveAndBuildClient.mockImplementation(() => {
      throwSystemAgentConnectionRequiredError();
    });

    await expect(
      invokeSystemAgent({
        userId: 'admin-1',
        role: AuthTokenRole.ADMIN,
        systemAgentId: 'sys-agent-1',
        message: 'Hello',
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      error: { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_REQUIRED },
    });
  });

  it('should throw connection invalid error when credential is not owned by user', async () => {
    mockResolveAndBuildClient.mockImplementation(() => {
      throwSystemAgentConnectionInvalidError();
    });

    await expect(
      invokeSystemAgent({
        userId: 'admin-1',
        role: AuthTokenRole.ADMIN,
        systemAgentId: 'sys-agent-1',
        message: 'Hello',
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      error: { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_INVALID },
    });
  });

  it('should throw connection invalid error when credential is archived', async () => {
    mockResolveAndBuildClient.mockImplementation(() => {
      throwSystemAgentConnectionInvalidError();
    });

    await expect(
      invokeSystemAgent({
        userId: 'admin-1',
        role: AuthTokenRole.ADMIN,
        systemAgentId: 'sys-agent-1',
        message: 'Hello',
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      error: { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_INVALID },
    });
  });

  it('should throw NotFoundError when system agent is archived or disabled', async () => {
    mockGetActiveById.mockRejectedValue(new NotFoundError('System agent not found'));

    await expect(
      invokeSystemAgent({
        userId: 'admin-1',
        role: AuthTokenRole.ADMIN,
        systemAgentId: 'archived-agent',
        message: 'Hello',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should propagate provider timeout as TimeoutError', async () => {
    mockInvoke.mockRejectedValue(new TimeoutError('Provider request timed out'));

    await expect(
      invokeSystemAgent({
        userId: 'admin-1',
        role: AuthTokenRole.ADMIN,
        systemAgentId: 'sys-agent-1',
        message: 'Hello',
      }),
    ).rejects.toThrow(TimeoutError);
  });
});
