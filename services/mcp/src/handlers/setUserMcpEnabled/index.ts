import { userMcpConfigDomain } from '@vassembly/domain-user-mcp-config';
import mcpDomain from '@vassembly/domain-mcp';
import { NotFoundError, UnauthorizedError } from '@vassembly/errors';

import type { SetUserMcpEnabledInput, SetUserMcpEnabledResult } from './types';
import type { ServiceContext } from '../../types';

export type { SetUserMcpEnabledInput, SetUserMcpEnabledResult };

export const setUserMcpEnabled = async (
  input: SetUserMcpEnabledInput,
  context: ServiceContext,
): Promise<SetUserMcpEnabledResult> => {
  if (!context.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  const mcpResult = await mcpDomain.queries.getById({ id: input.mcpId });
  const mcp = mcpResult.data;

  if (!mcp.configSchema) {
    throw new NotFoundError('MCP not found or not configurable');
  }

  const config = await userMcpConfigDomain.commands.setUserMcpEnabled({
    userId: context.userId,
    mcpId: input.mcpId,
    enabled: input.enabled,
    schema: mcp.configSchema,
  });

  return {
    mcpId: input.mcpId,
    enabled: config.enabled,
  };
};
