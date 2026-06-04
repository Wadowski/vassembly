import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

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
  isFirstSystemAgentPreference: z.boolean().optional(),
});

export const aiIntegrationCreateRoute = defineRoute({
  method: 'POST',
  url: '/',
  statusCode: 201,
  schema: {
    response: withErrorResponses(aiIntegrationCredentialResponseSchema, 201),
  },
  handler: async ({ body, headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { credential } = await agentService.createCredential({ userId, body: body as any });
    return credential;
  },
});
