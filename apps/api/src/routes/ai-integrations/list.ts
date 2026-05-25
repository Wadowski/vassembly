import {
  AI_INTEGRATION_LIST_ALL_STATUSES,
  AiIntegrationProvider,
  AiIntegrationStatus,
  type AiIntegrationListStatusFilter,
} from '@vassembly/domain-ai-integration';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';

const STATUS_FILTER_VALUES = [
  ...Object.values(AiIntegrationStatus),
  AI_INTEGRATION_LIST_ALL_STATUSES,
] as unknown as [AiIntegrationListStatusFilter, ...AiIntegrationListStatusFilter[]];

const PROVIDER_FILTER_VALUES = Object.values(AiIntegrationProvider) as unknown as [
  (typeof AiIntegrationProvider)[keyof typeof AiIntegrationProvider],
  ...(typeof AiIntegrationProvider)[keyof typeof AiIntegrationProvider][],
];

export const aiIntegrationListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional(),
  status: z.enum(STATUS_FILTER_VALUES).optional(),
  provider: z.enum(PROVIDER_FILTER_VALUES).optional(),
});

export const aiIntegrationListRoute = defineRoute({
  method: 'GET',
  url: '/',
  schema: { querystring: aiIntegrationListQuerySchema },
  handler: async ({ query, headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });
    return agentService.listCredentials({
      userId,
      page: query.page,
      size: query.size,
      search: query.search,
      status: query.status,
      provider: query.provider,
    });
  },
});
