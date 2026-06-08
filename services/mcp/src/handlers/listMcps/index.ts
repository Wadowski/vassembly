import mcpDomain from '@vassembly/domain-mcp';
import { UnauthorizedError } from '@vassembly/errors';

import type { ListMcpsInput, ListMcpsResult, ServiceContext } from './types';

export const listMcps = async (
  args: ListMcpsInput,
  context: ServiceContext,
): Promise<ListMcpsResult> => {
  if (context?.authenticatedUserId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return mcpDomain.queries.getList(args);
};
