import mcpDomain from '@vassembly/domain-mcp';
import { UnauthorizedError } from '@vassembly/errors';

import type { GetMcpInput, GetMcpResult, ServiceContext } from './types';

export const getMcp = async (
  args: GetMcpInput,
  context: ServiceContext,
): Promise<GetMcpResult> => {
  if (context?.authenticatedUserId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return mcpDomain.queries.getById(args);
};
