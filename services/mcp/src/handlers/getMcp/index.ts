import mcpDomain from '@vassembly/domain-mcp';
import { UnauthorizedError } from '@vassembly/errors';

import { getMcpAgentUsageCount } from '../../helpers/getMcpAgentUsageCount';
import { enrichMcpListWithUserStatus } from '../enrichMcpListWithUserStatus';

import type { GetMcpInput, GetMcpResult, ServiceContext } from './types';

export const getMcp = async (
  args: GetMcpInput,
  context: ServiceContext,
): Promise<GetMcpResult> => {
  if (context?.authenticatedUserId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const result = await mcpDomain.queries.getById(args);
  const agentUsageCount = await getMcpAgentUsageCount({
    userId: context.authenticatedUserId,
    mcpId: args.id,
  });
  const [enrichedMcp] = await enrichMcpListWithUserStatus(
    { mcps: [result.data] },
    { userId: context.authenticatedUserId },
  );

  if (enrichedMcp === undefined) {
    return {
      data: {
        ...result.data,
        agentUsageCount,
      },
    };
  }

  return {
    data: {
      ...enrichedMcp,
      agentUsageCount,
    },
  };
};
