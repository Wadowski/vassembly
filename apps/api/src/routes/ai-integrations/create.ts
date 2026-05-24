import { AiIntegrationProvider } from '@vassembly/domain-ai-integration';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';

const PROVIDER_VALUES = Object.values(AiIntegrationProvider) as [string, ...string[]];

export const aiIntegrationCreateBodySchema = z
  .object({
    name: z.string().min(1).max(100),
    provider: z.enum(PROVIDER_VALUES),
    apiKey: z.string().min(1).max(500).optional(),
    baseUrl: z.string().url().max(500).optional(),
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

export const aiIntegrationCreateRoute = defineRoute({
  method: 'POST',
  url: '/',
  statusCode: 201,
  schema: { body: aiIntegrationCreateBodySchema },
  handler: async ({ body, headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { credential } = await agentService.createCredential({ userId, body });
    return credential;
  },
});
