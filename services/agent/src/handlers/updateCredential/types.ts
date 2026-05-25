import { z } from 'zod';

import type { AiIntegrationCredentialResponse } from '@vassembly/domain-ai-integration';

export const UPDATE_CREDENTIAL_BODY_SCHEMA = z.object({
  name: z.string().min(1).max(100).optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  model: z.string().min(1).max(200).optional(),
});

export interface UpdateCredentialBody {
  name?: string;
  apiKey?: string;
  baseUrl?: string | null;
  organizationId?: string | null;
  model?: string;
}

export interface UpdateCredentialHandlerInput {
  userId: string;
  credentialId: string;
  body: UpdateCredentialBody;
}

export interface UpdateCredentialHandlerOutput {
  credential: AiIntegrationCredentialResponse;
}
