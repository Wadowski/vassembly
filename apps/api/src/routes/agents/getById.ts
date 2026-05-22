import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';

export const agentGetByIdRoute = defineRoute({
  method: 'GET',
  url: '/:id',
  handler: async ({ headers, params }) => {
    const agentId = params?.id;
    if (!agentId || agentId === '') {
      throw new WrongParamError('Missing agent id');
    }
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { agent } = await agentService.getAgent({ userId, agentId });
    return agent;
  },
});
