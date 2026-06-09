import { userMcpConfigDomain } from '@vassembly/domain-user-mcp-config';
import { UnauthorizedError } from '@vassembly/errors';

import type {
  ListUserMcpConfigurationsInput,
  ListUserMcpConfigurationsResult,
} from './types';
import type { ServiceContext } from '../../types';

export type { ListUserMcpConfigurationsInput, ListUserMcpConfigurationsResult };

const DEFAULT_LIST_LIMIT = 50;

export const listUserMcpConfigurations = async (
  input: ListUserMcpConfigurationsInput,
  context: ServiceContext,
): Promise<ListUserMcpConfigurationsResult> => {
  if (!context.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  return userMcpConfigDomain.queries.getUserMcpConfigs({
    userId: context.userId,
    limit: input.limit ?? DEFAULT_LIST_LIMIT,
  });
};
