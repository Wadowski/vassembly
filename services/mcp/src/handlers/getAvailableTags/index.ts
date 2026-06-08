import mcpDomain from '@vassembly/domain-mcp';
import { UnauthorizedError } from '@vassembly/errors';

import type { GetAvailableTagsInput, GetAvailableTagsResult, ServiceContext } from './types';

export const getAvailableTags = async (
  _args: GetAvailableTagsInput,
  context: ServiceContext,
): Promise<GetAvailableTagsResult> => {
  if (context?.authenticatedUserId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return mcpDomain.queries.getAvailableTags();
};
