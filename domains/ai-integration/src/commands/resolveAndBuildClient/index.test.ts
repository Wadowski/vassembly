import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockDecode, mockGetModeledProviderClient } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockDecode: vi.fn(),
  mockGetModeledProviderClient: vi.fn(),
}));

vi.mock('../../clients', () => ({
  aiIntegrationMongodbDao: {
    get: mockGet,
  },
  getModeledProviderClient: mockGetModeledProviderClient,
}));

vi.mock('@vassembly/client-encoder', () => ({
  decode: mockDecode,
}));

import { AiIntegrationConnectionStatus, AiIntegrationProvider, AiIntegrationStatus } from '../../constants';
import { resolveAndBuildClient } from './index';

import type { AiIntegrationCredentialModel } from '../../model';

const CREDENTIAL_ID = 'cred-1';
const USER_ID = 'user-1';

const MODELED_CLIENT = {
  invoke: vi.fn(),
};

const buildCredential = (
  overrides: Partial<AiIntegrationCredentialModel> = {},
): AiIntegrationCredentialModel =>
  ({
    id: CREDENTIAL_ID,
    name: 'My OpenAI',
    provider: AiIntegrationProvider.ChatGpt,
    model: 'gpt-4o',
    encryptedApiKey: 'encrypted-key',
    userId: USER_ID,
    status: AiIntegrationStatus.Active,
    connectionStatus: AiIntegrationConnectionStatus.Connected,
    removedAt: null,
    ...overrides,
  }) as AiIntegrationCredentialModel;

describe('resolveAndBuildClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(buildCredential());
    mockDecode.mockReturnValue('decoded-api-key');
    mockGetModeledProviderClient.mockReturnValue(MODELED_CLIENT);
  });

  it('should return client and integration snapshot from credential', async () => {
    const result = await resolveAndBuildClient({
      userId: USER_ID,
      connectionOverride: { integrationCredentialId: CREDENTIAL_ID },
    });

    expect(result.client).toBe(MODELED_CLIENT);
    expect(result.integrationSnapshot).toEqual({
      integrationName: 'My OpenAI',
      provider: AiIntegrationProvider.ChatGpt,
      model: 'gpt-4o',
    });
    expect(mockGetModeledProviderClient).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: AiIntegrationProvider.ChatGpt,
        model: 'gpt-4o',
      }),
    );
  });

  it('should use empty string for model when credential model is unset', async () => {
    mockGet.mockResolvedValue(buildCredential({ model: undefined }));

    const result = await resolveAndBuildClient({
      userId: USER_ID,
      connectionOverride: { integrationCredentialId: CREDENTIAL_ID },
    });

    expect(result.integrationSnapshot.model).toBe('');
  });
});
