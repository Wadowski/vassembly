import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-system-agent';

import { INVOKE_SYSTEM_AGENT_BODY_SCHEMA } from './schemas';

export const systemAgentInvokeRoute = defineRoute({
  method: 'POST',
  url: '/:id/invoke',
  schema: { body: INVOKE_SYSTEM_AGENT_BODY_SCHEMA },
  handler: async ({ body, headers, params }) => {
    const systemAgentId = params?.id;
    if (!systemAgentId || systemAgentId === '') {
      throw new WrongParamError('Missing system agent id');
    }

    const { userId, role } = await authHandlers.authorizeAdminRequest({ headers });

    return systemAgentService.invokeSystemAgent({
      userId,
      role,
      systemAgentId,
      message: body.message,
      connectionOverride: body.connectionOverride,
    });
  },
});
