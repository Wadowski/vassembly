import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-system-agent';

export const systemAgentGetPreferenceRoute = defineRoute({
  method: 'GET',
  url: '/connection-preference',
  handler: async ({ headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { preference } = await systemAgentService.getConnectionPreference({ userId });

    return preference;
  },
});
