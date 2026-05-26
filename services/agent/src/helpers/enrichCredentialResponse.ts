import { toAiIntegrationResponse } from '@vassembly/domain-ai-integration';

import { getAgentUsageCount } from './getAgentUsageCount';

import type {
  AiIntegrationCredentialModel,
  AiIntegrationCredentialResponse,
} from '@vassembly/domain-ai-integration';

interface EnrichCredentialModelParams {
  credential: AiIntegrationCredentialModel;
}

interface EnrichCredentialDtoParams {
  credential: AiIntegrationCredentialResponse;
}

const addAgentUsageCount = async (
  credential: AiIntegrationCredentialResponse,
): Promise<AiIntegrationCredentialResponse> => {
  const credentialId = credential.id;
  const userId = credential.userId;

  if (!credentialId || !userId) {
    return credential;
  }

  const agentUsageCount = await getAgentUsageCount({ userId, credentialId });
  return { ...credential, agentUsageCount };
};

export const enrichCredentialDto = async (
  params: EnrichCredentialDtoParams,
): Promise<AiIntegrationCredentialResponse> => {
  return addAgentUsageCount(params.credential);
};

export const enrichCredentialResponse = async (
  params: EnrichCredentialModelParams,
): Promise<AiIntegrationCredentialResponse> => {
  const response = toAiIntegrationResponse({ credential: params.credential });
  return addAgentUsageCount(response);
};
