import { MAX_PAGE_SIZE } from '@vassembly/domain-mcp';
import mcpDomain from '@vassembly/domain-mcp';
import specializationDomain from '@vassembly/domain-specialization';
import systemAgentDomain from '@vassembly/domain-system-agent';

import type { ListSpecializationsInput, ListSpecializationsResult } from './types';

export const listSpecializations = async (
  input: ListSpecializationsInput,
): Promise<ListSpecializationsResult> => {
  const { page, size, search } = input;

  const result = await specializationDomain.queries.getList({
    page,
    size,
    search,
  });

  const enrichedItems = await Promise.all(
    result.items.map(async (item) => {
      const [agentsResult, mcpsResult] = await Promise.all([
        systemAgentDomain.queries.getBySpecializationId({ specializationId: item.id }),
        mcpDomain.queries.getList({
          specializationId: item.id,
          page: 0,
          size: MAX_PAGE_SIZE,
        }),
      ]);

      return {
        ...item,
        agentIds: agentsResult.items
          .map((agent) => agent.id)
          .filter((agentId): agentId is string => agentId !== undefined),
        mcpIds: mcpsResult.items.map((mcp) => mcp.id),
      };
    }),
  );

  return {
    ...result,
    items: enrichedItems,
  };
};
