import { userMcpConfigDomain } from '@vassembly/domain-user-mcp-config';
import mcpDomain from '@vassembly/domain-mcp';
import { UnauthorizedError } from '@vassembly/errors';

import type {
  GetUserMcpConfigurationInput,
  GetUserMcpConfigurationResult,
} from './types';
import type { ServiceContext } from '../../types';

export type { GetUserMcpConfigurationInput, GetUserMcpConfigurationResult };

export const getUserMcpConfiguration = async (
  input: GetUserMcpConfigurationInput,
  context: ServiceContext,
): Promise<GetUserMcpConfigurationResult> => {
  if (!context.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  let mcpResult;

  try {
    mcpResult = await mcpDomain.queries.getById({ id: input.mcpId });
  } catch {
    return null;
  }

  const config = await userMcpConfigDomain.queries.getUserMcpConfig({
    userId: context.userId,
    mcpId: input.mcpId,
    configSchema: mcpResult.data.configSchema,
  });

  if (!config) {
    return null;
  }

  return config;
};
