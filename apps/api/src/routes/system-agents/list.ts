import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

import { SYSTEM_AGENT_LIST_QUERY_SCHEMA } from './schemas';

export const systemAgentAdminResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  rule: z.string(),
  category: z.string().optional(),
  status: z.string(),
  createdByAdminId: z.string(),
  updatedByAdminId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  removedAt: z.string().nullable(),
  assignedToolIds: z.array(z.string()),
});

export const systemAgentListResponseSchema = z.object({
  items: z.array(systemAgentAdminResponseSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
});

export const systemAgentListRoute = defineRoute({
  method: 'GET',
  url: '/',
  schema: {
    querystring: SYSTEM_AGENT_LIST_QUERY_SCHEMA,
    response: withErrorResponses(systemAgentListResponseSchema),
  },
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
