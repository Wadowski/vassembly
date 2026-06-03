import { AiIntegrationProvider } from '@vassembly/domain-ai-integration';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

export const aiIntegrationCreateBodySchema = z
  .object({
    name: z.string().min(1).max(100),
    provider: z.string(),
    apiKey: z.string().max(500).optional(),
    baseUrl: z.string().max(500).optional(),
    organizationId: z.string().max(100).optional(),
    model: z.string().min(1).max(200),
  })
  .superRefine((data, ctx) => {
    if (data.provider === AiIntegrationProvider.Gemini && !data.apiKey?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'apiKey is required for gemini', path: ['apiKey'] });
    }
    if (data.provider === AiIntegrationProvider.ChatGpt && !data.apiKey?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'apiKey is required for chatgpt', path: ['apiKey'] });
    }
    if (data.provider === AiIntegrationProvider.LmStudio && !data.baseUrl?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'baseUrl is required for lm_studio', path: ['baseUrl'] });
    }
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

export const aiIntegrationCreateRoute = defineRoute({
  method: 'POST',
  url: '/',
  statusCode: 201,
  schema: {
    body: aiIntegrationCreateBodySchema,
    response: withErrorResponses(aiIntegrationCredentialResponseSchema, 201),
  },
  handler: async ({ body, headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { credential } = await agentService.createCredential({ userId, body });
    return credential;
  },
});
