import { decode } from '@vassembly/client-encoder';
import {
  AiIntegrationProvider,
  AiIntegrationStatus,
} from '@vassembly/domain-ai-integration';
import { ValidationError } from '@vassembly/errors';
import { throwSystemAgentConnectionInvalidError } from '@vassembly/domain-system-agent';

import type {
  BuildModeledProviderClientParams,
  BuildModeledProviderClientResult,
} from './types';

const VALID_PROVIDERS = new Set<string>(Object.values(AiIntegrationProvider));

export const buildModeledProviderClient = async ({
  credential,
}: BuildModeledProviderClientParams): Promise<BuildModeledProviderClientResult> => {
  if (!credential.encryptedApiKey) {
    throw new ValidationError('Credential encrypted API key is required');
  }

  if (!credential.provider || !VALID_PROVIDERS.has(credential.provider)) {
    throw new ValidationError('Credential provider is invalid');
  }

  if (credential.status !== undefined && credential.status !== AiIntegrationStatus.Active) {
    throwSystemAgentConnectionInvalidError();
  }

  const apiKey = decode(credential.encryptedApiKey);

  // Import directly from clients module
  const { getModeledProviderClient } = await import('@vassembly/domain-ai-integration/src/clients');

  return getModeledProviderClient({
    provider: credential.provider,
    apiKey,
    baseUrl: credential.baseUrl,
    organizationId: credential.organizationId,
    model: credential.model ?? '',
  });
};
