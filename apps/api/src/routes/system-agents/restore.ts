import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-system-agent';

export const systemAgentRestoreRoute = defineRoute({
  method: 'POST',
  url: '/:id/restore',
  handler: async ({ headers, params }) => {
    const systemAgentId = params?.id;
    if (!systemAgentId || systemAgentId === '') {
      throw new WrongParamError('Missing system agent id');
    }

    const { userId } = await authHandlers.authorizeAdminRequest({ headers });
    const { systemAgent } = await systemAgentService.restoreSystemAgent({
      adminUserId: userId,
      systemAgentId,
    });

    return systemAgent;
  },
});
