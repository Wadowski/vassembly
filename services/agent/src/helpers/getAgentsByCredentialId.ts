import agentDomain, { AGENT_LIST_ALL_STATUSES, toAgentResponse } from '@vassembly/domain-agent';

import type { AgentResponse } from '@vassembly/domain-agent';

interface GetAgentsByCredentialIdParams {
  userId: string;
  credentialId: string;
}

const PAGE_SIZE = 50;

export const getAgentsByCredentialId = async (
  params: GetAgentsByCredentialIdParams,
): Promise<AgentResponse[]> => {
  const agents: AgentResponse[] = [];
  let page = 0;
  let totalCount = 0;

  do {
    const result = await agentDomain.queries.getListForUser({
      userId: params.userId,
      page,
      size: PAGE_SIZE,
      status: AGENT_LIST_ALL_STATUSES,
    });
    totalCount = result.totalCount;
    const matchingAgents = result.items.filter(
      (agent) => agent.integrationCredentialId === params.credentialId && !agent.removedAt,
    );
    agents.push(...matchingAgents.map((agent) => toAgentResponse(agent)));
    page += 1;
  } while (page * PAGE_SIZE < totalCount);

  return agents;
};
