import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';

export const agentDeleteRoute = defineRoute({
  method: 'DELETE',
  url: '/:id',
  handler: async ({ headers, params }) => {
    const agentId = params?.id;
    if (!agentId || agentId === '') {
      throw new WrongParamError('Missing agent id');
    }
    const { userId } = await authHandlers.authorizeRequest({ headers });
    return agentService.deleteAgent({ userId, agentId });
  },
});
