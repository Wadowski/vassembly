import { MAX_PAGE_SIZE } from '@vassembly/domain-mcp';
import mcpDomain from '@vassembly/domain-mcp';
import specializationDomain from '@vassembly/domain-specialization';
import systemAgentDomain, { toSystemAgentResponse } from '@vassembly/domain-system-agent';

import type { GetSpecializationInput, GetSpecializationResult } from './types';

export const getSpecialization = async (
  input: GetSpecializationInput,
): Promise<GetSpecializationResult> => {
  const { id } = input;

  const [specializationResult, agentsResult, mcpsResult] = await Promise.all([
    specializationDomain.queries.getById({ id }),
    systemAgentDomain.queries.getBySpecializationId({ specializationId: id }),
    mcpDomain.queries.getList({
      specializationId: id,
      page: 0,
      size: MAX_PAGE_SIZE,
    }),
  ]);

  const agents = agentsResult.items
    .filter((agent) => agent.id !== undefined)
    .map((agent) => {
      const response = toSystemAgentResponse({ systemAgent: agent });

      return {
        id: response.id,
        name: response.name,
        status: response.status,
      };
    });

  const agentIds = agents.map((agent) => agent.id);
  const mcps = mcpsResult.items.map((mcp) => ({
    id: mcp.id,
    name: mcp.name,
    slug: mcp.slug,
    iconPath: mcp.iconPath,
    description: mcp.description,
  }));
  const mcpIds = mcps.map((mcp) => mcp.id);

  return {
    specialization: {
      ...specializationResult.data,
      agentIds,
      mcpIds,
      agents,
      mcps,
    },
  };
};
