import agentDomain, { type AgentInvokeMcpServerConfig } from '@vassembly/domain-agent';
import aiIntegrationDomain from '@vassembly/domain-ai-integration';
import userMcpConfigDomain from '@vassembly/domain-user-mcp-config';
import { WrongParamError } from '@vassembly/errors';

import { resolveMcpSlugs } from '../../helpers/resolveMcpSlugs';

import type { InvokePersonalAgentParams, InvokePersonalAgentResult } from './types';

export const invokePersonalAgent = async (
  input: InvokePersonalAgentParams,
): Promise<InvokePersonalAgentResult> => {
  const { userId, agentId, message } = input;

  const { data: agent } = await agentDomain.queries.getById({ id: agentId, userId });

  if (!agent.integrationCredentialId) {
    throw new WrongParamError('Agent has no AI integration configured');
  }

  const modeledProviderClient = await aiIntegrationDomain.commands.resolveAndBuildClient({
    userId,
    connectionOverride: { integrationCredentialId: agent.integrationCredentialId },
  });

  const mcpIds = agent.assignedMcpIds ?? [];
  let mcpServerConfigs: AgentInvokeMcpServerConfig[] = [];
  let skippedMcpIds: string[] = [];

  if (mcpIds.length > 0) {
    const slugByMcpId = await resolveMcpSlugs({ mcpIds });
    const configsResult = await userMcpConfigDomain.commands.resolveMcpServerConfigs({
      userId,
      mcpConfigs: mcpIds.map((id) => ({ mcpId: id, slug: slugByMcpId[id] ?? '' })),
    });
    mcpServerConfigs = configsResult.serverConfigs;
    skippedMcpIds = configsResult.skippedMcpIds;
  }

  const result = await agentDomain.commands.invoke({
    modeledProviderClient,
    agentId,
    userId,
    message,
    systemMessage: agent.rule,
    mcpServerConfigs,
  });

  return {
    ...result,
    metadata: {
      mcpIdsUsed: mcpIds.filter((id) => !skippedMcpIds.includes(id)),
      skippedMcpIds,
    },
  };
};
