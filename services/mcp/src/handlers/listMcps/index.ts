import mcpDomain from '@vassembly/domain-mcp';
import { UnauthorizedError } from '@vassembly/errors';

import { getMcpAgentUsageCount } from '../../helpers/getMcpAgentUsageCount';
import { enrichMcpListWithUserStatus } from '../enrichMcpListWithUserStatus';

import type { ListMcpsInput, ListMcpsResult, ServiceContext } from './types';

export const listMcps = async (
  args: ListMcpsInput,
  context: ServiceContext,
): Promise<ListMcpsResult> => {
  if (context?.authenticatedUserId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const catalogResult = await mcpDomain.queries.getList(args);
  const enrichedItems = await enrichMcpListWithUserStatus(
    { mcps: catalogResult.items },
    { userId: context.authenticatedUserId },
  );
  const itemsWithUsageCount = await Promise.all(
    enrichedItems.map(async (mcp) => ({
      ...mcp,
      agentUsageCount: await getMcpAgentUsageCount({
        userId: context.authenticatedUserId,
        mcpId: mcp.id,
      }),
    })),
  );

  return {
    ...catalogResult,
    items: itemsWithUsageCount,
  };
};
