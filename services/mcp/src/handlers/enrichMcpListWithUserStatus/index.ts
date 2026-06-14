import { userMcpConfigDomain } from '@vassembly/domain-user-mcp-config';
import { UnauthorizedError } from '@vassembly/errors';

import type {
  EnrichMcpListInput,
  EnrichMcpListWithUserStatusResult,
} from './types';
import type { ServiceContext } from '../../types';

export type { EnrichMcpListInput, EnrichMcpListWithUserStatusResult };

export const enrichMcpListWithUserStatus = async (
  input: EnrichMcpListInput,
  context: ServiceContext,
): Promise<EnrichMcpListWithUserStatusResult> => {
  if (!context.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  const mcpIds = input.mcps.map((mcp) => mcp.id);
  const statuses = await userMcpConfigDomain.queries.getConfigurationStatuses({
    userId: context.userId,
    mcpIds,
  });

  return input.mcps.map((mcp) => ({
    ...mcp,
    configurationStatus: statuses[mcp.id] ?? 'pending',
  }));
};
