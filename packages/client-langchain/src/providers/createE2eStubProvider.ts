import type { AiProviderClient, AiProviderInvokeParams, AiProviderInvokeResult } from '../types';

const E2E_STUB_MODEL = 'gemini-2.0-flash';

export const E2E_STUB_COMPLETION_DELAY_MS = 4_000;

const buildStubInvokeResult = ({ message }: AiProviderInvokeParams): AiProviderInvokeResult => ({
  message: `E2E completed output for: ${message}`,
  model: E2E_STUB_MODEL,
  usage: {
    promptTokens: 12,
    completionTokens: 24,
    totalTokens: 36,
  },
});

export const E2E_STUB_API_KEY = 'e2e-web-test-api-key';

export const createE2eStubProvider = (): AiProviderClient => ({
  testConnection: async () => ({
    success: true,
    models: [E2E_STUB_MODEL],
  }),
  getModels: async () => [E2E_STUB_MODEL],
  invoke: async (params) => {
    await new Promise((resolve) => {
      setTimeout(resolve, E2E_STUB_COMPLETION_DELAY_MS);
    });
    return buildStubInvokeResult(params);
  },
});
