import { assertRequiredFields, toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { AiIntegrationCredentialModel } from './model';
import type { AiIntegrationCredentialResponse } from './dto';

const REQUIRED_FIELDS = [
  'id',
  'userId',
  'name',
  'provider',
  'status',
  'connectionStatus',
  'createdAt',
  'updatedAt',
] as const;

export interface ToAiIntegrationResponseParams {
  credential: AiIntegrationCredentialModel;
}

export const toAiIntegrationResponse = ({
  credential,
}: ToAiIntegrationResponseParams): AiIntegrationCredentialResponse => {
  assertRequiredFields({
    entity: credential,
    fields: REQUIRED_FIELDS,
    entityName: 'AI integration credential',
  });

  const hasApiKey = !!credential.encryptedApiKey;
  const apiKeyHint = credential.encryptedApiKey
    ? `...${credential.encryptedApiKey.slice(-4)}`
    : null;

  return {
    id: credential.id!,
    userId: credential.userId!,
    name: credential.name!,
    provider: credential.provider!,
    hasApiKey,
    apiKeyHint,
    baseUrl: credential.baseUrl,
    organizationId: credential.organizationId,
    status: credential.status!,
    connectionStatus: credential.connectionStatus!,
    lastTestedAt: toNullableIsoString(credential.lastTestedAt) ?? undefined,
    lastConnectionError: credential.lastConnectionError,
    model: credential.model,
    createdAt: toIsoString({ value: credential.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: credential.updatedAt!, fieldName: 'updatedAt' }),
    removedAt: toNullableIsoString(credential.removedAt),
  };
};
