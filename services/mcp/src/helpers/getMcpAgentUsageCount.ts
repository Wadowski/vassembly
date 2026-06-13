import agentDomain from '@vassembly/domain-agent';

export interface GetMcpAgentUsageCountParams {
  userId: string;
  mcpId: string;
}

export const getMcpAgentUsageCount = async ({
  userId,
  mcpId,
}: GetMcpAgentUsageCountParams): Promise<number> =>
  agentDomain.queries.getCountByMcpId({ userId, mcpId });
