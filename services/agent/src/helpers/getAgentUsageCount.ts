import agentDomain from '@vassembly/domain-agent';

interface GetAgentUsageCountParams {
  userId: string;
  credentialId: string;
}

export const getAgentUsageCount = async (params: GetAgentUsageCountParams): Promise<number> => {
  return agentDomain.queries.getCountByIntegrationCredentialId({
    userId: params.userId,
    credentialId: params.credentialId,
  });
};
