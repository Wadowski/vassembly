import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';

export const aiIntegrationDeleteRoute = defineRoute({
  method: 'DELETE',
  url: '/:id',
  handler: async ({ headers, params }) => {
    const credentialId = params?.id;
    if (!credentialId || credentialId === '') {
      throw new WrongParamError('Missing credential id');
    }
    const { userId } = await authHandlers.authorizeRequest({ headers });
    return agentService.deleteCredential({ userId, credentialId });
  },
});
