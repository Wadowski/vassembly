import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

export const systemAgentPreferenceResponseSchema = z.object({
  userId: z.string(),
  integrationCredentialId: z.string(),
  updatedAt: z.string(),
});

export const systemAgentGetPreferenceRoute = defineRoute({
  method: 'GET',
  url: '/connection-preference',
  schema: {
    response: withErrorResponses(systemAgentPreferenceResponseSchema),
  },
  handler: async ({ headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { preference } = await systemAgentService.getConnectionPreference({ userId });

    return preference;
  },
});
