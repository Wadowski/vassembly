import systemAgentDomain from '@vassembly/domain-system-agent';

import { assertAdminRole } from '../../helpers/assertAdminRole';
import { mapAdminResponse } from '../../helpers/mapAdminResponse';

import type { ListSystemAgentsParams, ListSystemAgentsResult } from './types';

export const listSystemAgents = async (
  input: ListSystemAgentsParams,
): Promise<ListSystemAgentsResult> => {
  const { role, status, search, page, size } = input;

  assertAdminRole({ role });

  const result = await systemAgentDomain.queries.getAdminList({
    status,
    search,
    page,
    size,
  });

  return {
    items: result.items.map((item) => mapAdminResponse(item)),
    total: result.totalCount,
    page: result.page,
    size: result.size,
  };
};
