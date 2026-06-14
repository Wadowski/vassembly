import agentDomain, { toAgentResponse } from '@vassembly/domain-agent';
import mcpDomain from '@vassembly/domain-mcp';
import userMcpConfigDomain from '@vassembly/domain-user-mcp-config';
import { WrongParamError } from '@vassembly/errors';

import type { GetMcpWithAgentsHandlerInput, GetMcpWithAgentsHandlerOutput } from './types';

export const getMcpWithAgents = async (
  input: GetMcpWithAgentsHandlerInput,
): Promise<GetMcpWithAgentsHandlerOutput> => {
  const [mcpResult, config] = await Promise.all([
    mcpDomain.queries.getById({ id: input.mcpId }),
    userMcpConfigDomain.queries.getUserMcpConfigModel({
      userId: input.userId,
      mcpId: input.mcpId,
    }),
  ]);

  if (config === null) {
    throw new WrongParamError('MCP is not configured');
  }

  const listResult = await agentDomain.queries.getListByMcpId({
    userId: input.userId,
    mcpId: input.mcpId,
    page: input.page,
    size: input.size,
  });

  const agents = listResult.items.map((agent) => toAgentResponse({ agent }));

  return {
    mcp: mcpResult.data,
    agents,
    totalCount: listResult.totalCount,
    page: listResult.page,
    size: listResult.size,
  };
};
