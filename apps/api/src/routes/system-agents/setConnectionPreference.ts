import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { authorizeProtectedRequest } from '../shared/authorizeProtectedRequest';
import systemAgentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

import { SET_CONNECTION_PREFERENCE_BODY_SCHEMA } from './schemas';

export const systemAgentPreferenceResponseSchema = z.object({
  userId: z.string(),
  integrationCredentialId: z.string(),
  updatedAt: z.string(),
});

export const systemAgentSetPreferenceRoute = defineRoute({
  method: 'PUT',
  url: '/connection-preference',
  schema: {
    body: SET_CONNECTION_PREFERENCE_BODY_SCHEMA,
    response: withErrorResponses(systemAgentPreferenceResponseSchema),
  },
  handler: async ({ body, headers }) => {
    const { userId } = await authorizeProtectedRequest({ headers });
    const { preference } = await systemAgentService.setConnectionPreference({
      userId,
      integrationCredentialId: body.integrationCredentialId,
    });

    return preference;
  },
});
