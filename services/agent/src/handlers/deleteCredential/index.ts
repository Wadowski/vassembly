import aiIntegrationDomain from '@vassembly/domain-ai-integration';

import { getAgentUsageCount } from '../../helpers/getAgentUsageCount';

import type { DeleteCredentialHandlerInput, DeleteCredentialHandlerOutput } from './types';

export const deleteCredential = async (
  input: DeleteCredentialHandlerInput,
): Promise<DeleteCredentialHandlerOutput> => {
  await aiIntegrationDomain.queries.getById({
    id: input.credentialId,
    userId: input.userId,
  });

  const agentUsageCount = await getAgentUsageCount({
    userId: input.userId,
    credentialId: input.credentialId,
  });

  if (agentUsageCount > 0) {
    console.warn(
      `Deleting AI integration credential ${input.credentialId} used by ${agentUsageCount} agents`,
    );
  }

  await aiIntegrationDomain.commands.removeSoft({
    id: input.credentialId,
    userId: input.userId,
  });

  return { success: true, message: 'Credential deleted' };
};
