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
  mockResolveInvokeCredential,
  mockBuildModeledProviderClient,
} = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  mockGetActiveById: vi.fn(),
  mockResolveInvokeCredential: vi.fn(),
  mockBuildModeledProviderClient: vi.fn(),
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

vi.mock('../../helpers/resolveInvokeCredential', () => ({
  resolveInvokeCredential: mockResolveInvokeCredential,
}));

vi.mock('../../helpers/buildModeledProviderClient', () => ({
  buildModeledProviderClient: mockBuildModeledProviderClient,
}));

import { invokeSystemAgent } from './index';

const RESOLVED_CREDENTIAL = {
  id: 'cred-1',
  userId: 'user-1',
  provider: 'chatgpt',
  encryptedApiKey: 'encrypted-key',
  status: AiIntegrationStatus.Active,
  connectionStatus: AiIntegrationConnectionStatus.Connected,
  removedAt: null,
  model: 'gpt-4',
};

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
    mockResolveInvokeCredential.mockResolvedValue(RESOLVED_CREDENTIAL);
    mockBuildModeledProviderClient.mockResolvedValue(MODELED_CLIENT);
    mockInvoke.mockResolvedValue({
      message: 'Here is a summary.',
      usage: { promptTokens: 120, completionTokens: 80, totalTokens: 200 },
      metadata: { model: 'gpt-4', provider: 'chatgpt' },
    });
  });

  it('should resolve credential invoke agent and return provider message', async () => {
    const result = await invokeSystemAgent({
      userId: 'user-1',
      role: AuthTokenRole.USER,
      systemAgentId: 'sys-agent-1',
      message: 'Summarize our Q1 compliance checklist.',
    });

    expect(result.message).toBe('Here is a summary.');
    expect(result.usage?.totalTokens).toBe(200);
    expect(result.metadata?.provider).toBe('chatgpt');
  });

  it('should use admin override credential when admin invokes with connectionOverride', async () => {
    const overrideCredential = {
      ...RESOLVED_CREDENTIAL,
      id: 'cred-admin',
      userId: 'admin-1',
    };
    mockResolveInvokeCredential.mockResolvedValue(overrideCredential);

    const result = await invokeSystemAgent({
      userId: 'admin-1',
      role: AuthTokenRole.ADMIN,
      systemAgentId: 'sys-agent-1',
      message: 'Hello',
      connectionOverride: { integrationCredentialId: 'cred-admin' },
    });

    expect(result.message).toBe('Here is a summary.');
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
    mockResolveInvokeCredential.mockImplementation(() => {
      throwSystemAgentConnectionRequiredError();
    });

    await expect(
      invokeSystemAgent({
        userId: 'user-1',
        role: AuthTokenRole.USER,
        systemAgentId: 'sys-agent-1',
        message: 'Hello',
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      error: { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_REQUIRED },
    });
  });

  it('should throw connection invalid error when credential is not owned by user', async () => {
    mockResolveInvokeCredential.mockImplementation(() => {
      throwSystemAgentConnectionInvalidError();
    });

    await expect(
      invokeSystemAgent({
        userId: 'user-1',
        role: AuthTokenRole.USER,
        systemAgentId: 'sys-agent-1',
        message: 'Hello',
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      error: { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_INVALID },
    });
  });

  it('should throw connection invalid error when credential is archived', async () => {
    mockResolveInvokeCredential.mockResolvedValue({
      ...RESOLVED_CREDENTIAL,
      status: AiIntegrationStatus.Archived,
    });
    mockBuildModeledProviderClient.mockImplementation(() => {
      throwSystemAgentConnectionInvalidError();
    });

    await expect(
      invokeSystemAgent({
        userId: 'user-1',
        role: AuthTokenRole.USER,
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
        userId: 'user-1',
        role: AuthTokenRole.USER,
        systemAgentId: 'archived-agent',
        message: 'Hello',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should propagate provider timeout as TimeoutError', async () => {
    mockInvoke.mockRejectedValue(new TimeoutError('Provider request timed out'));

    await expect(
      invokeSystemAgent({
        userId: 'user-1',
        role: AuthTokenRole.USER,
        systemAgentId: 'sys-agent-1',
        message: 'Hello',
      }),
    ).rejects.toThrow(TimeoutError);
  });
});
