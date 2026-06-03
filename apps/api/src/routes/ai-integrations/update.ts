import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

export const aiIntegrationPatchBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    apiKey: z.string().min(1).max(500).optional(),
    baseUrl: z.string().url().max(500).optional().nullable(),
    organizationId: z.string().max(100).optional().nullable(),
    model: z.string().min(1).max(200).optional(),
  })
  .strict();

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

export const aiIntegrationPatchRoute = defineRoute({
  method: 'PATCH',
  url: '/:id',
  schema: {
    body: aiIntegrationPatchBodySchema,
    response: withErrorResponses(aiIntegrationCredentialResponseSchema),
  },
  handler: async ({ body, headers, params }) => {
    const credentialId = params?.id;
    if (!credentialId || credentialId === '') {
      throw new WrongParamError('Missing credential id');
    }
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { credential } = await agentService.updateCredential({
      userId,
      credentialId,
      body,
    });
    return credential;
  },
});
