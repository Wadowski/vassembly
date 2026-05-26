import { decode } from '@vassembly/client-encoder';
import { ValidationError } from '@vassembly/errors';

import { AiIntegrationConnectionStatus, AiIntegrationProvider, AiIntegrationStatus } from '../../constants';
import { getModeledProviderClient, aiIntegrationMongodbDao } from '../../clients';
import { aiIntegrationCredentialFactory } from '../../model';

import type { ResolveAndBuildClientParams, ResolveAndBuildClientResult } from './types';
import type { AiIntegrationCredentialModel } from '../../model';

const throwConnectionInvalidError = (): never => {
  throw new ValidationError("Your system agent connection isn't working. Update it in Settings or test the connection.", {
    code: 'SYSTEM_AGENT_CONNECTION_INVALID',
  });
};

const throwConnectionRequiredError = (): never => {
  throw new ValidationError('Add an AI connection before using platform agents.', {
    code: 'SYSTEM_AGENT_CONNECTION_REQUIRED',
  });
};

const validateCredentialOwnership = (userId: string, credential: AiIntegrationCredentialModel): void => {
  if (credential.userId !== userId) {
    throwConnectionInvalidError();
  }

  if (credential.status !== AiIntegrationStatus.Active || credential.removedAt) {
    throwConnectionInvalidError();
  }

  if (credential.connectionStatus !== AiIntegrationConnectionStatus.Connected) {
    throwConnectionInvalidError();
  }
};

const validateProviderCredential = (credential: AiIntegrationCredentialModel): void => {
  if (!credential.encryptedApiKey) {
    throw new ValidationError('Credential encrypted API key is required');
  }

  const validProviders = Object.values(AiIntegrationProvider);
  if (!credential.provider || !validProviders.includes(credential.provider)) {
    throw new ValidationError('Credential provider is invalid');
  }

  if (credential.status !== AiIntegrationStatus.Active) {
    throwConnectionInvalidError();
  }
};

export const resolveAndBuildClient = async (
  params: ResolveAndBuildClientParams,
): Promise<ResolveAndBuildClientResult> => {
  const { userId, connectionOverride } = params;

  let credentialId: string | undefined;
  if (connectionOverride?.integrationCredentialId) {
    credentialId = connectionOverride.integrationCredentialId;
  } else {
    throwConnectionRequiredError();
  }

  const where = aiIntegrationCredentialFactory.create({ id: credentialId });
  const credentialResult = await aiIntegrationMongodbDao.get(where);

  if (!credentialResult) {
    throwConnectionInvalidError();
  }

  const credential = credentialResult as AiIntegrationCredentialModel;

  validateCredentialOwnership(userId, credential);
  validateProviderCredential(credential);

  const apiKey = decode(credential.encryptedApiKey!);

  return getModeledProviderClient({
    provider: credential.provider!,
    apiKey,
    baseUrl: credential.baseUrl,
    organizationId: credential.organizationId,
    model: credential.model || '',
  });
};
