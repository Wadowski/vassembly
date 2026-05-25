import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

const { mockDecode, mockGetModeledProviderClient } = vi.hoisted(() => ({
  mockDecode: vi.fn(),
  mockGetModeledProviderClient: vi.fn(),
}));

vi.mock('@vassembly/client-encoder', () => ({
  decode: mockDecode,
}));

vi.mock('@vassembly/domain-ai-integration', () => ({
  default: {
    clients: {
      getModeledProviderClient: mockGetModeledProviderClient,
    },
  },
  AiIntegrationProvider: {
    Gemini: 'gemini',
    ChatGpt: 'chatgpt',
    LmStudio: 'lm_studio',
  },
  AiIntegrationStatus: {
    Active: 'active',
    Disabled: 'disabled',
    Archived: 'archived',
  },
}));

import { AiIntegrationProvider } from '@vassembly/domain-ai-integration';
import { buildModeledProviderClient } from './index';

const CREDENTIAL = {
  id: 'cred-1',
  userId: 'user-1',
  provider: AiIntegrationProvider.ChatGpt,
  encryptedApiKey: 'encrypted-key-value',
  baseUrl: undefined,
  organizationId: 'org-1',
  model: 'gpt-4',
  status: 'active',
};

const MODELED_CLIENT = {
  invoke: vi.fn(),
};

describe('buildModeledProviderClient helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDecode.mockReturnValue('decoded-api-key');
    mockGetModeledProviderClient.mockReturnValue(MODELED_CLIENT);
  });

  it('should decode credential key and return modeled provider client', async () => {
    const result = await buildModeledProviderClient({ credential: CREDENTIAL });

    expect(result).toBeDefined();
    expect(result.invoke).toBeDefined();
    expect(typeof result.invoke).toBe('function');
  });

  it('should throw ValidationError when encryptedApiKey is missing', async () => {
    await expect(
      buildModeledProviderClient({
        credential: {
          ...CREDENTIAL,
          encryptedApiKey: undefined,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when provider is invalid', async () => {
    await expect(
      buildModeledProviderClient({
        credential: {
          ...CREDENTIAL,
          provider: 'unknown-provider',
        },
      }),
    ).rejects.toThrow(ValidationError);
  });
});
