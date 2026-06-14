import agentDomain, { toAgentResponse } from '@vassembly/domain-agent';
import aiIntegrationDomain from '@vassembly/domain-ai-integration';

import { validateAssignedMcpIds } from '../../helpers/validateAssignedMcpIds';
import { validateAssignedToolIds } from '../../helpers/validateAssignedToolIds';

import type { CreateAgentHandlerInput } from './types';

export const createAgent = async (input: CreateAgentHandlerInput) => {
  const { body, userId } = input;

  await agentDomain.queries.assertUniqueNameForUser({
    userId,
    name: body.name,
  });

  if (body.integrationCredentialId) {
    await aiIntegrationDomain.queries.getById({
      id: body.integrationCredentialId,
      userId,
    });
  }

  if (body.assignedMcpIds && body.assignedMcpIds.length > 0) {
    await validateAssignedMcpIds({ userId, assignedMcpIds: body.assignedMcpIds });
  }

  if (body.assignedToolIds !== undefined) {
    await validateAssignedToolIds({
      assignedToolIds: body.assignedToolIds,
      agentType: 'personal',
    });
  }

  const result = await agentDomain.commands.create({
    ...body,
    userId,
  });

  return { agent: toAgentResponse({ agent: result.data }) };
};
