import agentDomain, { toAgentResponse } from '@vassembly/domain-agent';
import aiIntegrationDomain from '@vassembly/domain-ai-integration';
import { InternalError, WrongParamError } from '@vassembly/errors';

import { validateAssignedMcpIds } from '../../helpers/validateAssignedMcpIds';
import { validateAssignedToolIds } from '../../helpers/validateAssignedToolIds';

import type { UpdateAgentHandlerInput, UpdateAgentHandlerOutput } from './types';

export const updateAgent = async (input: UpdateAgentHandlerInput): Promise<UpdateAgentHandlerOutput> => {
  const existing = await agentDomain.queries.getById({
    id: input.agentId,
    userId: input.userId,
  });

  if (existing.data.removedAt) {
    throw new WrongParamError('Agent has been deleted; restore before updating.');
  }

  if (input.patch.name !== undefined) {
    await agentDomain.queries.assertUniqueNameForUser({
      userId: input.userId,
      name: input.patch.name,
      excludeId: input.agentId,
    });
  }

  const nextIntegrationCredentialId = input.patch.integrationCredentialId;
  const hasNewIntegrationCredentialId = nextIntegrationCredentialId && nextIntegrationCredentialId !== existing.data.integrationCredentialId;

  if (hasNewIntegrationCredentialId) {
    await aiIntegrationDomain.queries.getById({
      id: nextIntegrationCredentialId,
      userId: input.userId,
    });
  }

  if (input.patch.assignedMcpIds && input.patch.assignedMcpIds.length > 0) {
    await validateAssignedMcpIds({
      userId: input.userId,
      assignedMcpIds: input.patch.assignedMcpIds,
    });
  }

  if (input.patch.assignedToolIds !== undefined) {
    await validateAssignedToolIds({
      assignedToolIds: input.patch.assignedToolIds,
      agentType: 'personal',
    });
  }

  const updated = await agentDomain.commands.update({
    id: input.agentId,
    data: input.patch,
  });

  if (!updated.data) {
    throw new InternalError('Agent update produced no persisted row');
  }

  return { agent: toAgentResponse({ agent: updated.data }) };
};
