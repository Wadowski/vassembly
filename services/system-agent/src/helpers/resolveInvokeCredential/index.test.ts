import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthTokenRole } from '@vassembly/domain-auth-token';
import {
  AiIntegrationConnectionStatus,
  AiIntegrationStatus,
} from '@vassembly/domain-ai-integration';
import { SYSTEM_AGENT_ERROR_CODES } from '@vassembly/domain-system-agent';

const { mockGetPreferenceByUserId, mockGetCredentialById } = vi.hoisted(() => ({
  mockGetPreferenceByUserId: vi.fn(),
  mockGetCredentialById: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', async () => {
  const domain = await import('../../../../../domains/system-agent/src/index.js');

  return {
    ...domain,
    default: {
      commands: {},
      queries: {
        getPreferenceByUserId: mockGetPreferenceByUserId,
      },
    },
  };
});

vi.mock('@vassembly/domain-ai-integration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vassembly/domain-ai-integration')>();

  return {
    ...actual,
    default: {
      ...actual.default,
      queries: {
        getById: mockGetCredentialById,
      },
    },
  };
});

import { resolveInvokeCredential } from './index';

const VALID_CREDENTIAL = {
  id: 'cred-1',
  userId: 'user-1',
  name: 'OpenAI',
  provider: 'chatgpt',
  encryptedApiKey: 'encrypted-key',
  status: AiIntegrationStatus.Active,
  connectionStatus: AiIntegrationConnectionStatus.Connected,
  removedAt: null,
};

describe('resolveInvokeCredential helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPreferenceByUserId.mockResolvedValue({
      data: {
        userId: 'user-1',
        integrationCredentialId: 'cred-1',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    mockGetCredentialById.mockResolvedValue({ data: VALID_CREDENTIAL });
  });

  it('should return validated credential when user preference points to owned connected credential', async () => {
    const result = await resolveInvokeCredential({
      userId: 'user-1',
      role: AuthTokenRole.USER,
    });

    expect(result.id).toBe('cred-1');
    expect(result.userId).toBe('user-1');
    expect(result.connectionStatus).toBe(AiIntegrationConnectionStatus.Connected);
  });

  it('should return override credential when admin provides connectionOverride', async () => {
    mockGetCredentialById.mockResolvedValue({
      data: {
        ...VALID_CREDENTIAL,
        id: 'cred-admin',
        userId: 'admin-1',
      },
    });

    const result = await resolveInvokeCredential({
      userId: 'admin-1',
      role: AuthTokenRole.ADMIN,
      connectionOverride: { integrationCredentialId: 'cred-admin' },
    });

    expect(result.id).toBe('cred-admin');
    expect(result.userId).toBe('admin-1');
  });

  it('should throw connection required error when user has no preference', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({ data: null });

    await expect(
      resolveInvokeCredential({
        userId: 'user-1',
        role: AuthTokenRole.USER,
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      error: { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_REQUIRED },
    });
  });

  it('should throw connection invalid error when preference references deleted credential', async () => {
    mockGetCredentialById.mockResolvedValue({ data: null });

    await expect(
      resolveInvokeCredential({
        userId: 'user-1',
        role: AuthTokenRole.USER,
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      error: { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_INVALID },
    });
  });

  it('should throw connection invalid error when credential is not owned by user', async () => {
    mockGetCredentialById.mockResolvedValue({
      data: {
        ...VALID_CREDENTIAL,
        userId: 'user-other',
      },
    });

    await expect(
      resolveInvokeCredential({
        userId: 'user-1',
        role: AuthTokenRole.USER,
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      error: { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_INVALID },
    });
  });

  it('should throw connection invalid error when credential connectionStatus is not connected', async () => {
    mockGetCredentialById.mockResolvedValue({
      data: {
        ...VALID_CREDENTIAL,
        connectionStatus: AiIntegrationConnectionStatus.Failed,
      },
    });

    await expect(
      resolveInvokeCredential({
        userId: 'user-1',
        role: AuthTokenRole.USER,
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      error: { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_INVALID },
    });
  });
});
