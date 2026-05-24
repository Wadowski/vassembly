import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';

export const aiIntegrationPatchBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    apiKey: z.string().min(1).max(500).optional(),
    baseUrl: z.string().url().max(500).optional().nullable(),
    organizationId: z.string().max(100).optional().nullable(),
  })
  .strict();

export const aiIntegrationPatchRoute = defineRoute({
  method: 'PATCH',
  url: '/:id',
  schema: { body: aiIntegrationPatchBodySchema },
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
