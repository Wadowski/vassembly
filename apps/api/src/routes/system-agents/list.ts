import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-agent';

import { SYSTEM_AGENT_LIST_QUERY_SCHEMA } from './schemas';

export const systemAgentListRoute = defineRoute({
  method: 'GET',
  url: '/',
  schema: { querystring: SYSTEM_AGENT_LIST_QUERY_SCHEMA },
  handler: async ({ query, headers }) => {
    const { userId } = await authHandlers.authorizeAdminRequest({ headers });

    return systemAgentService.listSystemAgents({
      adminUserId: userId,
      status: query.status,
      search: query.search,
      page: query.page,
      size: query.size,
    });
  },
});
