import { userMcpConfigDomain } from '@vassembly/domain-user-mcp-config';
import mcpDomain from '@vassembly/domain-mcp';
import { NotFoundError, UnauthorizedError } from '@vassembly/errors';

import type {
  CreateUserMcpConfigurationInput,
  CreateUserMcpConfigurationResult,
} from './types';
import type { ServiceContext } from '../../types';

export type { CreateUserMcpConfigurationInput, CreateUserMcpConfigurationResult };

export const createUserMcpConfiguration = async (
  input: CreateUserMcpConfigurationInput,
  context: ServiceContext,
): Promise<CreateUserMcpConfigurationResult> => {
  if (!context.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  const mcpResult = await mcpDomain.queries.getById({ id: input.mcpId });
  const mcp = mcpResult.data;

  if (!mcp.configSchema) {
    throw new NotFoundError('MCP not found or not configurable');
  }

  const config = await userMcpConfigDomain.commands.createUserMcpConfig({
    userId: context.userId,
    mcpId: input.mcpId,
    fieldValues: input.fieldValues,
    schema: mcp.configSchema,
  });

  return userMcpConfigDomain.mappers.toDTO({ model: config, configSchema: mcp.configSchema });
};
