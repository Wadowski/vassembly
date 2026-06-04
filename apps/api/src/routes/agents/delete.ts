import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

export const deleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const agentDeleteRoute = defineRoute({
  method: 'DELETE',
  url: '/:id',
  schema: {
    response: withErrorResponses(deleteResponseSchema),
  },
  handler: async ({ headers, params }) => {
    const agentId = params?.id;
    if (!agentId || agentId === '') {
      throw new WrongParamError('Missing agent id');
    }
    const { userId } = await authHandlers.authorizeRequest({ headers });
    return agentService.deleteAgent({ userId, agentId });
  },
});
