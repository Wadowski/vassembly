import { AiIntegrationProvider } from '@vassembly/domain-ai-integration';
import { z } from 'zod';

import type { AiIntegrationCredentialResponse } from '@vassembly/domain-ai-integration';

export const CREATE_CREDENTIAL_BODY_SCHEMA = z
  .object({
    name: z.string().min(1).max(100),
    provider: z.string(),
    apiKey: z.string().max(500).optional(),
    baseUrl: z.string().max(500).optional().nullable(),
    organizationId: z.string().optional().nullable(),
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

export type CreateCredentialBody = z.infer<typeof CREATE_CREDENTIAL_BODY_SCHEMA>;

export interface CreateCredentialHandlerInput {
  userId: string;
  body: CreateCredentialBody;
}

export interface CreateCredentialHandlerOutput {
  credential: AiIntegrationCredentialResponse & {
    isFirstSystemAgentPreference?: boolean;
  };
}
