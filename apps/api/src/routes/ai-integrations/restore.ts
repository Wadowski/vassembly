import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';

export const aiIntegrationRestoreRoute = defineRoute({
  method: 'POST',
  url: '/:id/restore',
  handler: async ({ headers, params }) => {
    const credentialId = params?.id;
    if (!credentialId || credentialId === '') {
      throw new WrongParamError('Missing credential id');
    }
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { credential } = await agentService.restoreCredential({ userId, credentialId });
    return credential;
  },
});
