import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-agent';

export const systemAgentGetUserPreferenceRoute = defineRoute({
  method: 'GET',
  url: '/connection-preference/users/:userId',
  handler: async ({ headers, params }) => {
    const targetUserId = params?.userId;
    if (!targetUserId || targetUserId === '') {
      throw new WrongParamError('Missing user id');
    }

    const { userId } = await authHandlers.authorizeAdminRequest({ headers });
    const { preference } = await systemAgentService.getUserConnectionPreference({
      adminUserId: userId,
      targetUserId,
    });

    return preference;
  },
});
