import {
  AGENT_LIST_ALL_STATUSES,
  AgentStatus,
  type AgentListStatusFilter,
} from '@vassembly/domain-agent';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';

const STATUS_FILTER_VALUES = [...Object.values(AgentStatus), AGENT_LIST_ALL_STATUSES] as unknown as [
  AgentListStatusFilter,
  ...AgentListStatusFilter[],
];

export const agentListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional(),
  status: z.enum(STATUS_FILTER_VALUES).optional(),
});

export const agentListRoute = defineRoute({
  method: 'GET',
  url: '/',
  schema: { querystring: agentListQuerySchema },
  handler: async ({ query, headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });
    return agentService.listAgents({
      userId,
      page: query.page,
      size: query.size,
      search: query.search,
      status: query.status,
    });
  },
});
