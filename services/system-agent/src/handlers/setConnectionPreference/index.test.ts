import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, NotFoundError } from '@vassembly/errors';
import { AuthTokenRole } from '@vassembly/domain-auth-token';
import {
  AiIntegrationConnectionStatus,
  AiIntegrationStatus,
} from '@vassembly/domain-ai-integration';
import { SYSTEM_AGENT_ERROR_CODES } from '@vassembly/domain-system-agent';

const { mockGetCredentialById, mockGetPreferenceByUserId, mockUpsertPreference } = vi.hoisted(() => ({
  mockGetCredentialById: vi.fn(),
  mockGetPreferenceByUserId: vi.fn(),
  mockUpsertPreference: vi.fn(),
}));

vi.mock('@vassembly/domain-ai-integration', () => ({
  default: {
    queries: {
      getById: mockGetCredentialById,
    },
  },
  AiIntegrationStatus: {
    Active: 'active',
    Disabled: 'disabled',
    Archived: 'archived',
  },
  AiIntegrationConnectionStatus: {
    Untested: 'untested',
    Connected: 'connected',
    Failed: 'failed',
  },
}));

vi.mock('@vassembly/domain-system-agent', async () => {
  const domain = await import('../../../../../domains/system-agent/src/index.js');

  return {
    ...domain,
    default: {
      commands: {
        upsertPreference: mockUpsertPreference,
      },
      queries: {
        getPreferenceByUserId: mockGetPreferenceByUserId,
      },
    },
  };
});

import { setConnectionPreference } from './index';

const OWNED_CREDENTIAL = {
  id: 'cred-1',
  userId: 'user-1',
  name: 'OpenAI',
  provider: 'chatgpt',
  encryptedApiKey: 'encrypted-key',
  status: AiIntegrationStatus.Active,
  connectionStatus: AiIntegrationConnectionStatus.Connected,
  removedAt: null,
};

describe('setConnectionPreference handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCredentialById.mockResolvedValue({ data: OWNED_CREDENTIAL });
  });

  it('should persist preference when user selects an owned active credential', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({
      data: {
        userId: 'user-1',
        integrationCredentialId: 'cred-old',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    mockUpsertPreference.mockResolvedValue({
      data: {
        userId: 'user-1',
        integrationCredentialId: 'cred-1',
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    });

    const result = await setConnectionPreference({
      userId: 'user-1',
      role: AuthTokenRole.ADMIN,
      integrationCredentialId: 'cred-1',
    });

    expect(result.preference.integrationCredentialId).toBe('cred-1');
    expect(result.preference.userId).toBe('user-1');
  });

  it('should throw connection invalid error when credential is not owned by user', async () => {
    mockGetCredentialById.mockResolvedValue({
      data: {
        ...OWNED_CREDENTIAL,
        userId: 'user-other',
      },
    });

    await expect(
      setConnectionPreference({
        userId: 'user-1',
        role: AuthTokenRole.ADMIN,
        integrationCredentialId: 'cred-1',
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      error: { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_INVALID },
    });
  });

  it('should throw NotFoundError when credential does not exist', async () => {
    mockGetCredentialById.mockRejectedValue(new NotFoundError('Credential not found'));

    await expect(
      setConnectionPreference({
        userId: 'user-1',
        role: AuthTokenRole.ADMIN,
        integrationCredentialId: 'missing-cred',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when caller is not admin', async () => {
    await expect(
      setConnectionPreference({
        userId: 'user-1',
        role: AuthTokenRole.USER,
        integrationCredentialId: 'cred-1',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should create preference when user has no existing preference', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({ data: null });
    mockUpsertPreference.mockResolvedValue({
      data: {
        userId: 'user-1',
        integrationCredentialId: 'cred-1',
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    });

    const result = await setConnectionPreference({
      userId: 'user-1',
      role: AuthTokenRole.ADMIN,
      integrationCredentialId: 'cred-1',
    });

    expect(result.preference.integrationCredentialId).toBe('cred-1');
  });

  it('should update preference when user already has a saved preference', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({
      data: {
        userId: 'user-1',
        integrationCredentialId: 'cred-old',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    mockUpsertPreference.mockResolvedValue({
      data: {
        userId: 'user-1',
        integrationCredentialId: 'cred-1',
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });

    const result = await setConnectionPreference({
      userId: 'user-1',
      role: AuthTokenRole.ADMIN,
      integrationCredentialId: 'cred-1',
    });

    expect(result.preference.integrationCredentialId).toBe('cred-1');
    expect(result.preference.updatedAt).toBe(new Date('2026-03-01T00:00:00.000Z').toISOString());
  });

  it('should reject archived credentials with connection invalid error', async () => {
    mockGetCredentialById.mockResolvedValue({
      data: {
        ...OWNED_CREDENTIAL,
        status: AiIntegrationStatus.Archived,
      },
    });

    await expect(
      setConnectionPreference({
        userId: 'user-1',
        role: AuthTokenRole.ADMIN,
        integrationCredentialId: 'cred-1',
      }),
    ).rejects.toMatchObject({
      statusCode: 422,
      error: { code: SYSTEM_AGENT_ERROR_CODES.CONNECTION_INVALID },
    });
  });
});
