import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-system-agent';

import { CREATE_SYSTEM_AGENT_BODY_SCHEMA } from './schemas';

export const systemAgentCreateRoute = defineRoute({
  method: 'POST',
  url: '/',
  statusCode: 201,
  schema: { body: CREATE_SYSTEM_AGENT_BODY_SCHEMA },
  handler: async ({ body, headers }) => {
    const { userId } = await authHandlers.authorizeAdminRequest({ headers });
    const { systemAgent } = await systemAgentService.createSystemAgent({
      adminUserId: userId,
      body,
    });

    return systemAgent;
  },
});
