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
import { withErrorResponses } from '../errorSchema';

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

export const aiIntegrationCredentialResponseSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  provider: z.string().optional(),
  hasApiKey: z.boolean().optional(),
  apiKeyHint: z.string().nullable().optional(),
  baseUrl: z.string().optional(),
  organizationId: z.string().optional(),
  status: z.string().optional(),
  connectionStatus: z.string().optional(),
  lastTestedAt: z.string().optional(),
  lastConnectionError: z.string().optional(),
  model: z.string().optional(),
  agentUsageCount: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  removedAt: z.string().nullable().optional(),
});

export const aiIntegrationListResponseSchema = z.object({
  items: z.array(aiIntegrationCredentialResponseSchema),
  totalCount: z.number(),
  page: z.number(),
  size: z.number(),
});

export const aiIntegrationListRoute = defineRoute({
  method: 'GET',
  url: '/',
  schema: {
    querystring: aiIntegrationListQuerySchema,
    response: withErrorResponses(aiIntegrationListResponseSchema),
  },
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
