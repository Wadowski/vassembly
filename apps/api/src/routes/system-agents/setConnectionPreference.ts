import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-system-agent';

import { SET_CONNECTION_PREFERENCE_BODY_SCHEMA } from './schemas';

export const systemAgentSetPreferenceRoute = defineRoute({
  method: 'PUT',
  url: '/connection-preference',
  schema: { body: SET_CONNECTION_PREFERENCE_BODY_SCHEMA },
  handler: async ({ body, headers }) => {
    const { userId, role } = await authHandlers.authorizeAdminRequest({ headers });
    const { preference } = await systemAgentService.setConnectionPreference({
      userId,
      role,
      integrationCredentialId: body.integrationCredentialId,
    });

    return preference;
  },
});
