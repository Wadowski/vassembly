import { WrongParamError } from '@vassembly/errors';
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

export const systemAgentGetUserPreferenceRoute = defineRoute({
  method: 'GET',
  url: '/connection-preference/users/:userId',
  schema: {
    response: withErrorResponses(systemAgentPreferenceResponseSchema),
  },
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
