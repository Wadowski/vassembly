import aiIntegrationDomain from '@vassembly/domain-ai-integration';
import systemAgentDomain from '@vassembly/domain-system-agent';
import { ConflictError, WrongParamError } from '@vassembly/errors';

import { getAgentUsageCount } from '../../helpers/getAgentUsageCount';

import type { DeleteCredentialHandlerInput, DeleteCredentialHandlerOutput } from './types';

const SYSTEM_AGENT_PREFERENCE_DELETE_MESSAGE =
  'Cannot delete this credential because it powers system agents. ' +
  'Choose another connection in Settings, then try again.';

export const deleteCredential = async (
  input: DeleteCredentialHandlerInput,
): Promise<DeleteCredentialHandlerOutput> => {
  await aiIntegrationDomain.queries.getById({
    id: input.credentialId,
    userId: input.userId,
  });

  const preference = await systemAgentDomain.queries.getPreferenceByUserId({
    userId: input.userId,
  });

  if (preference.data?.integrationCredentialId === input.credentialId) {
    throw new ConflictError(SYSTEM_AGENT_PREFERENCE_DELETE_MESSAGE);
  }

  const agentUsageCount = await getAgentUsageCount({
    userId: input.userId,
    credentialId: input.credentialId,
  });

  if (agentUsageCount > 0) {
    throw new WrongParamError(
      `Credential is used by ${agentUsageCount} agents and cannot be deleted`,
    );
  }

  await aiIntegrationDomain.commands.removeSoft({
    id: input.credentialId,
    userId: input.userId,
  });

  return { success: true, message: 'Credential deleted' };
};
