import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetModeledProviderClient, mockConfigPlatformAi } = vi.hoisted(() => ({
  mockGetModeledProviderClient: vi.fn(),
  mockConfigPlatformAi: {
    provider: 'gemini',
    apiKey: 'platform-gemini-key',
    baseUrl: '',
    defaultModel: 'gemini-2.0-flash',
    organizationId: undefined as string | undefined,
  },
}));

vi.mock('@vassembly/config', () => ({
  config: {
    platformAi: mockConfigPlatformAi,
  },
}));

vi.mock('../../clients', () => ({
  getModeledProviderClient: mockGetModeledProviderClient,
  aiIntegrationMongodbDao: {
    get: vi.fn(() => {
      throw new Error('resolvePlatformClient must not query MongoDB');
    }),
  },
}));

vi.mock('@vassembly/client-encoder', () => ({
  decode: vi.fn(() => {
    throw new Error('resolvePlatformClient must not decode credentials');
  }),
}));

import { AiIntegrationProvider } from '../../constants';
import { resolvePlatformClient } from './index';

const MODELED_CLIENT = {
  invoke: vi.fn(),
};

describe('resolvePlatformClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigPlatformAi.provider = AiIntegrationProvider.Gemini;
    mockConfigPlatformAi.apiKey = 'platform-gemini-key';
    mockConfigPlatformAi.baseUrl = '';
    mockConfigPlatformAi.defaultModel = 'gemini-2.0-flash';
    mockConfigPlatformAi.organizationId = undefined;
    mockGetModeledProviderClient.mockReturnValue(MODELED_CLIENT);
  });

  it('should return client and platform integration snapshot from gemini config', async () => {
    const result = await resolvePlatformClient();

    expect(result.client).toBe(MODELED_CLIENT);
    expect(result.integrationSnapshot).toEqual({
      integrationName: 'Platform AI',
      provider: AiIntegrationProvider.Gemini,
      model: 'gemini-2.0-flash',
    });
  });

  it('should return client and snapshot from deep_seek platform config', async () => {
    mockConfigPlatformAi.provider = AiIntegrationProvider.DeepSeek;
    mockConfigPlatformAi.apiKey = 'platform-deepseek-key';
    mockConfigPlatformAi.baseUrl = 'https://api.deepseek.com/v1';
    mockConfigPlatformAi.defaultModel = 'deepseek-chat';

    const result = await resolvePlatformClient();

    expect(result.client).toBe(MODELED_CLIENT);
    expect(result.integrationSnapshot).toEqual({
      integrationName: 'Platform AI',
      provider: AiIntegrationProvider.DeepSeek,
      model: 'deepseek-chat',
    });
  });

  it('should build lm_studio client without apiKey', async () => {
    mockConfigPlatformAi.provider = AiIntegrationProvider.LmStudio;
    mockConfigPlatformAi.apiKey = '';
    mockConfigPlatformAi.baseUrl = 'http://localhost:1234/v1';
    mockConfigPlatformAi.defaultModel = 'local-model';

    const result = await resolvePlatformClient();

    expect(result.client).toBe(MODELED_CLIENT);
    expect(result.integrationSnapshot).toEqual({
      integrationName: 'Platform AI',
      provider: AiIntegrationProvider.LmStudio,
      model: 'local-model',
    });
  });

  it('should use defaultModel from platform config in snapshot', async () => {
    mockConfigPlatformAi.defaultModel = 'custom-platform-model';

    const result = await resolvePlatformClient();

    expect(result.integrationSnapshot.model).toBe('custom-platform-model');
  });
});
