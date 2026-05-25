import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-system-agent';

import { CATALOG_LIST_QUERY_SCHEMA } from './schemas';

export const systemAgentCatalogListRoute = defineRoute({
  method: 'GET',
  url: '/catalog',
  schema: { querystring: CATALOG_LIST_QUERY_SCHEMA },
  handler: async ({ query, headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });

    return systemAgentService.listCatalog({
      userId,
      search: query.search,
      category: query.category,
      page: query.page,
      size: query.size,
    });
  },
});
