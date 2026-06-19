import { AiIntegrationProvider } from '@vassembly/domain-ai-integration';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

const PROVIDER_VALUES = Object.values(AiIntegrationProvider) as [string, ...string[]];

export const aiIntegrationTestConnectionBodySchema = z
  .object({
    credentialId: z.string().optional(),
    provider: z.enum(PROVIDER_VALUES).optional(),
    apiKey: z.string().optional(),
    baseUrl: z.string().url().optional().nullable(),
    organizationId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasCredentialId = !!data.credentialId?.trim();
    const hasProvider = !!data.provider;

    if (hasCredentialId && hasProvider) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide either credentialId or provider credentials, not both',
        path: ['credentialId'],
      });
    }

    if (!hasCredentialId && !hasProvider) {
      ctx.addIssue({
        code: 'custom',
        message: 'Either credentialId or provider is required',
        path: ['credentialId'],
      });
    }

    if (hasProvider && data.provider === AiIntegrationProvider.Gemini && !data.apiKey?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'apiKey is required for gemini', path: ['apiKey'] });
    }

    if (hasProvider && data.provider === AiIntegrationProvider.ChatGpt && !data.apiKey?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'apiKey is required for chatgpt', path: ['apiKey'] });
    }

    if (hasProvider && data.provider === AiIntegrationProvider.LmStudio && !data.baseUrl?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'baseUrl is required for lm_studio', path: ['baseUrl'] });
    }

    if (hasProvider && data.provider === AiIntegrationProvider.DeepSeek && !data.apiKey?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'apiKey is required for deep_seek', path: ['apiKey'] });
    }

    if (hasProvider && data.provider === AiIntegrationProvider.Anthropic && !data.apiKey?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'apiKey is required for anthropic', path: ['apiKey'] });
    }
  });

export const testConnectionResponseSchema = z.object({
  success: z.boolean(),
  connectionStatus: z.string(),
  models: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export const aiIntegrationTestConnectionRoute = defineRoute({
  method: 'POST',
  url: '/test-connection',
  schema: {
    body: aiIntegrationTestConnectionBodySchema,
    response: withErrorResponses(testConnectionResponseSchema),
  },
  handler: async ({ body, headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });
    return agentService.testConnection({ userId, body });
  },
});
