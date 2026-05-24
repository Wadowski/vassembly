import { toAiIntegrationResponse } from '@vassembly/domain-ai-integration';

import { getAgentUsageCount } from './getAgentUsageCount';

import type { AiIntegrationCredentialModel, AiIntegrationCredentialResponse } from '@vassembly/domain-ai-integration';

interface EnrichCredentialResponseParams {
  credential: AiIntegrationCredentialModel;
}

export const enrichCredentialResponse = async (
  params: EnrichCredentialResponseParams,
): Promise<AiIntegrationCredentialResponse> => {
  const { credential } = params;
  const response = toAiIntegrationResponse(credential);
  const credentialId = credential.id;
  const userId = credential.userId;

  if (!credentialId || !userId) {
    return response;
  }

  const agentUsageCount = await getAgentUsageCount({ userId, credentialId });
  return { ...response, agentUsageCount };
};
