import agentDomain, { toAgentResponse } from '@vassembly/domain-agent';
import { InternalError } from '@vassembly/errors';

import type { UnassignMcpFromAgentHandlerInput, UnassignMcpFromAgentHandlerOutput } from './types';

export const unassignMcpFromAgent = async (
  input: UnassignMcpFromAgentHandlerInput,
): Promise<UnassignMcpFromAgentHandlerOutput> => {
  const existing = await agentDomain.queries.getById({
    id: input.agentId,
    userId: input.userId,
  });

  const currentIds = existing.data.assignedMcpIds ?? [];
  const nextIds = currentIds.filter((id) => id !== input.mcpId);

  if (nextIds.length === currentIds.length) {
    return { agent: existing.data };
  }

  const updated = await agentDomain.commands.update({
    id: input.agentId,
    data: { assignedMcpIds: nextIds },
  });

  if (!updated.data) {
    throw new InternalError('Agent update produced no persisted row');
  }

  return { agent: toAgentResponse({ agent: updated.data }) };
};
