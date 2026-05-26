import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-system-agent';

import { UPDATE_SYSTEM_AGENT_BODY_SCHEMA } from './schemas';

export const systemAgentUpdateRoute = defineRoute({
  method: 'PATCH',
  url: '/:id',
  schema: { body: UPDATE_SYSTEM_AGENT_BODY_SCHEMA },
  handler: async ({ body, headers, params }) => {
    const systemAgentId = params?.id;
    if (!systemAgentId || systemAgentId === '') {
      throw new WrongParamError('Missing system agent id');
    }

    const { userId } = await authHandlers.authorizeAdminRequest({ headers });
    const { systemAgent } = await systemAgentService.updateSystemAgent({
      adminUserId: userId,
      systemAgentId,
      body,
    });

    return systemAgent;
  },
});
