import { describe, it, expect } from 'vitest';

import { toAiIntegrationResponse } from './toAiIntegrationResponse';
import type { AiIntegrationCredentialModel } from './model';

describe('toAiIntegrationResponse', () => {
  it('should expose hasApiKey and apiKeyHint without encryptedApiKey field', () => {
    const credential: AiIntegrationCredentialModel = {
      id: 'cred-1',
      userId: 'user-1',
      name: 'Gemini',
      provider: 'gemini',
      encryptedApiKey: 'encrypted-secret-value-abcd',
      status: 'active',
      connectionStatus: 'connected',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      removedAt: null,
    };

    const response = toAiIntegrationResponse(credential);

    expect(response.hasApiKey).toBe(true);
    expect(response.apiKeyHint).toBe('...abcd');
    expect('encryptedApiKey' in response).toBe(false);
  });

  it('should report hasApiKey false when no encrypted key stored', () => {
    const credential: AiIntegrationCredentialModel = {
      id: 'cred-2',
      userId: 'user-1',
      name: 'Local LM',
      provider: 'lm_studio',
      baseUrl: 'http://localhost:1234',
      status: 'active',
      connectionStatus: 'untested',
    };

    const response = toAiIntegrationResponse(credential);

    expect(response.hasApiKey).toBe(false);
    expect(response.apiKeyHint).toBeNull();
  });
});
