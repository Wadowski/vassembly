import aiIntegrationDomain from '@vassembly/domain-ai-integration';

import { enrichCredentialResponse } from '../../helpers/enrichCredentialResponse';
import { getAgentsByCredentialId } from '../../helpers/getAgentsByCredentialId';

import type {
  GetCredentialWithAgentsHandlerInput,
  GetCredentialWithAgentsHandlerOutput,
} from './types';

export const getCredentialWithAgents = async (
  input: GetCredentialWithAgentsHandlerInput,
): Promise<GetCredentialWithAgentsHandlerOutput> => {
  const result = await aiIntegrationDomain.queries.getById({
    id: input.credentialId,
    userId: input.userId,
  });

  const [credential, agents] = await Promise.all([
    enrichCredentialResponse({ credential: result.data }),
    getAgentsByCredentialId({ userId: input.userId, credentialId: input.credentialId }),
  ]);

  return { credential, agents };
};
