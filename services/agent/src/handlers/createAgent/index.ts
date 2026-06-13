import agentDomain, { toAgentResponse } from '@vassembly/domain-agent';
import aiIntegrationDomain from '@vassembly/domain-ai-integration';

import { validateAssignedMcpIds } from '../../helpers/validateAssignedMcpIds';

import type { CreateAgentHandlerInput } from './types';

export const createAgent = async (input: CreateAgentHandlerInput) => {
  const { body, userId } = input;

  if (body.integrationCredentialId) {
    await aiIntegrationDomain.queries.getById({
      id: body.integrationCredentialId,
      userId,
    });
  }

  if (body.assignedMcpIds && body.assignedMcpIds.length > 0) {
    await validateAssignedMcpIds({ userId, assignedMcpIds: body.assignedMcpIds });
  }

  const result = await agentDomain.commands.create({
    ...body,
    userId,
  });

  return { agent: toAgentResponse({ agent: result.data }) };
};
