import { decode } from '@vassembly/client-encoder';
import { ValidationError } from '@vassembly/errors';
import systemAgentDomain, {
  throwSystemAgentConnectionInvalidError,
  throwSystemAgentConnectionRequiredError,
} from '@vassembly/domain-system-agent';

import { AiIntegrationConnectionStatus, AiIntegrationProvider, AiIntegrationStatus } from '../../constants';
import { getModeledProviderClient, aiIntegrationMongodbDao } from '../../clients';
import { aiIntegrationCredentialFactory } from '../../model';

import type { ResolveAndBuildClientParams, ResolveAndBuildClientResult } from './types';
import type { AiIntegrationCredentialModel } from '../../model';

const validateCredentialOwnership = (userId: string, credential: AiIntegrationCredentialModel): void => {
  if (credential.userId !== userId) {
    throwSystemAgentConnectionInvalidError();
  }

  if (credential.status !== AiIntegrationStatus.Active || credential.removedAt) {
    throwSystemAgentConnectionInvalidError();
  }

  if (credential.connectionStatus !== AiIntegrationConnectionStatus.Connected) {
    throwSystemAgentConnectionInvalidError();
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
    throwSystemAgentConnectionInvalidError();
  }
};

export const resolveAndBuildClient = async (
  params: ResolveAndBuildClientParams,
): Promise<ResolveAndBuildClientResult> => {
  const { userId, connectionOverride } = params;

  const credentialId = connectionOverride?.integrationCredentialId
    ? connectionOverride.integrationCredentialId
    : (await systemAgentDomain.queries.getPreferenceByUserId({ userId })).data?.integrationCredentialId;

  if (!credentialId) {
    throwSystemAgentConnectionRequiredError();
  }

  const where = aiIntegrationCredentialFactory.create({ id: credentialId });
  const credential = await aiIntegrationMongodbDao.get(where);

  if (!credential) {
    throwSystemAgentConnectionInvalidError();
  }

  validateCredentialOwnership(userId, credential);
  validateProviderCredential(credential);

  const apiKey = decode(credential.encryptedApiKey);

  return getModeledProviderClient({
    provider: credential.provider,
    apiKey,
    baseUrl: credential.baseUrl,
    organizationId: credential.organizationId,
    model: credential.model || '',
  });
};
