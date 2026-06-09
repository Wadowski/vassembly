import { userMcpConfigDomain } from '@vassembly/domain-user-mcp-config';
import mcpDomain from '@vassembly/domain-mcp';
import { NotFoundError, UnauthorizedError } from '@vassembly/errors';

import type {
  UpdateUserMcpConfigurationInput,
  UpdateUserMcpConfigurationResult,
} from './types';
import type { ServiceContext } from '../../types';

export type { UpdateUserMcpConfigurationInput, UpdateUserMcpConfigurationResult };

export const updateUserMcpConfiguration = async (
  input: UpdateUserMcpConfigurationInput,
  context: ServiceContext,
): Promise<UpdateUserMcpConfigurationResult> => {
  if (!context.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  const mcpResult = await mcpDomain.queries.getById({ id: input.mcpId });
  const mcp = mcpResult.data;

  if (!mcp.configSchema) {
    throw new NotFoundError('MCP not found');
  }

  const config = await userMcpConfigDomain.commands.updateUserMcpConfig({
    userId: context.userId,
    mcpId: input.mcpId,
    fieldValues: input.fieldValues,
    schema: mcp.configSchema,
  });

  return userMcpConfigDomain.mappers.toDTO({ model: config, configSchema: mcp.configSchema });
};
