import { AiIntegrationProvider } from '@vassembly/domain-ai-integration';
import { z } from 'zod';

import type { AiIntegrationCredentialResponse } from '@vassembly/domain-ai-integration';

const PROVIDER_VALUES = Object.values(AiIntegrationProvider) as [string, ...string[]];

export const CREATE_CREDENTIAL_BODY_SCHEMA = z
  .object({
    name: z.string().min(1).max(100),
    provider: z.enum(PROVIDER_VALUES),
    apiKey: z.string().optional(),
    baseUrl: z.string().url().optional().nullable(),
    organizationId: z.string().optional().nullable(),
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

export interface CreateCredentialBody {
  name: string;
  provider: string;
  apiKey?: string;
  baseUrl?: string | null;
  organizationId?: string | null;
}

export interface CreateCredentialHandlerInput {
  userId: string;
  body: CreateCredentialBody;
}

export interface CreateCredentialHandlerOutput {
  credential: AiIntegrationCredentialResponse;
}
