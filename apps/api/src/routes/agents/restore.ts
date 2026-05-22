import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';

export const agentRestoreRoute = defineRoute({
  method: 'POST',
  url: '/:id/restore',
  handler: async ({ headers, params }) => {
    const agentId = params?.id;
    if (!agentId || agentId === '') {
      throw new WrongParamError('Missing agent id');
    }
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { agent } = await agentService.restoreAgent({ userId, agentId });
    return agent;
  },
});
