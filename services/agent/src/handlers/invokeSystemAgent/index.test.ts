import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, NotFoundError, TimeoutError } from '@vassembly/errors';
import {
  SYSTEM_AGENT_ERROR_CODES,
  throwSystemAgentConnectionInvalidError,
  throwSystemAgentConnectionRequiredError,
} from '@vassembly/domain-system-agent';

const {
  mockAssertHasRole,
  mockInvoke,
  mockGetActiveById,
  mockGetPreferenceByUserId,
  mockResolveAndBuildClient,
} = vi.hoisted(() => ({
  mockAssertHasRole: vi.fn(),
  mockInvoke: vi.fn(),
  mockGetActiveById: vi.fn(),
  mockGetPreferenceByUserId: vi.fn(),
  mockResolveAndBuildClient: vi.fn(),
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
        invoke: mockInvoke,
      },
      queries: {
        getActiveById: mockGetActiveById,
        getPreferenceByUserId: mockGetPreferenceByUserId,
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

const RESOLVE_RESULT = {
  client: MODELED_CLIENT,
  integrationSnapshot: {
    integrationName: 'My OpenAI',
    provider: 'chatgpt',
    model: 'gpt-4o',
  },
};

describe('invokeSystemAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertHasRole.mockResolvedValue(undefined);
    mockGetActiveById.mockResolvedValue({
      data: {
        id: 'sys-agent-1',
        name: 'Compliance Bot',
        rule: 'You help with compliance.',
        status: 'active',
        removedAt: null,
      },
    });
    mockGetPreferenceByUserId.mockResolvedValue({
      data: {
        integrationCredentialId: 'cred-default',
      },
    });
    mockResolveAndBuildClient.mockResolvedValue(RESOLVE_RESULT);
    mockInvoke.mockResolvedValue({
      message: 'Here is a summary.',
      usage: { promptTokens: 120, completionTokens: 80, totalTokens: 200 },
      metadata: { model: 'gpt-4', provider: 'chatgpt' },
    });
  });

  it('should resolve credential invoke agent and return provider message', async () => {
    const result = await invokeSystemAgent({
      userId: 'admin-1',
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
      systemAgentId: 'sys-agent-1',
      message: 'Hello',
      connectionOverride: { integrationCredentialId: 'cred-admin' },
    });

    expect(mockResolveAndBuildClient).toHaveBeenCalledWith({
      userId: 'admin-1',
      connectionOverride: { integrationCredentialId: 'cred-admin' },
    });
    expect(result.message).toBe('Here is a summary.');
  });

  it('should throw ForbiddenError when non-admin sends connectionOverride', async () => {
    mockAssertHasRole.mockRejectedValue(new ForbiddenError('Admin access required'));

    await expect(
      invokeSystemAgent({
        userId: 'user-1',
        systemAgentId: 'sys-agent-1',
        message: 'Hello',
        connectionOverride: { integrationCredentialId: 'cred-other' },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should succeed when non-admin user invokes without connectionOverride', async () => {
    const result = await invokeSystemAgent({
      userId: 'user-1',
      systemAgentId: 'sys-agent-1',
      message: 'Hello',
    });

    expect(mockResolveAndBuildClient).toHaveBeenCalledWith({
      userId: 'user-1',
      connectionOverride: { integrationCredentialId: 'cred-default' },
    });
    expect(result.message).toBe('Here is a summary.');
  });

  it('should throw connection required error when user has no preference', async () => {
    mockResolveAndBuildClient.mockImplementation(() => {
      throwSystemAgentConnectionRequiredError();
    });

    await expect(
      invokeSystemAgent({
        userId: 'admin-1',
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
        systemAgentId: 'sys-agent-1',
        message: 'Hello',
      }),
    ).rejects.toThrow(TimeoutError);
  });
});
