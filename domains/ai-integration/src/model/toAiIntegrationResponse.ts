import type { AiIntegrationCredentialModel } from './model';
import type { AiIntegrationCredentialResponse } from './dto';

export const toAiIntegrationResponse = (
  credential: AiIntegrationCredentialModel,
): AiIntegrationCredentialResponse => {
  const hasApiKey = !!credential.encryptedApiKey;
  const apiKeyHint = credential.encryptedApiKey ? `...${credential.encryptedApiKey.slice(-4)}` : null;

  return {
    id: credential.id,
    userId: credential.userId,
    name: credential.name,
    provider: credential.provider,
    hasApiKey,
    apiKeyHint,
    baseUrl: credential.baseUrl,
    organizationId: credential.organizationId,
    status: credential.status,
    connectionStatus: credential.connectionStatus,
    lastTestedAt: credential.lastTestedAt ? credential.lastTestedAt.toISOString() : undefined,
    lastConnectionError: credential.lastConnectionError,
    model: credential.model,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
    removedAt: credential.removedAt,
  };
};
