import {
  AGENT_LIST_ALL_STATUSES,
  AgentStatus,
  type AgentListStatusFilter,
} from '@vassembly/domain-agent';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

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

export const agentResponseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  rule: z.string().optional(),
  userId: z.string().optional(),
  status: z.string().optional(),
  integrationCredentialId: z.string().optional(),
  assignedMcpIds: z.array(z.string()),
  assignedToolIds: z.array(z.string()),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  removedAt: z.string().nullable().optional(),
});

export const agentListResponseSchema = z.object({
  items: z.array(agentResponseSchema),
  totalCount: z.number(),
  page: z.number(),
  size: z.number(),
});

export const agentListRoute = defineRoute({
  method: 'GET',
  url: '/',
  schema: {
    querystring: agentListQuerySchema,
    response: withErrorResponses(agentListResponseSchema),
  },
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
