import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';
import userDomain from '@vassembly/domain-user';

import type { ListSystemAgentsParams, ListSystemAgentsResult } from './types';

export const listSystemAgents = async (
  input: ListSystemAgentsParams,
): Promise<ListSystemAgentsResult> => {
  const { adminUserId, status, search, page, size } = input;

  await userDomain.queries.assertHasRole({ userId: adminUserId, role: AUTH_TOKEN_ROLE.ADMIN });

  const result = await systemAgentDomain.queries.getAdminList({
    status,
    search,
    page,
    size,
  });

  return {
    items: result.items,
    total: result.totalCount,
    page: result.page,
    size: result.size,
  };
};
