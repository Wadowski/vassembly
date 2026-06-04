import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

export const agentResponseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  rule: z.string().optional(),
  userId: z.string().optional(),
  status: z.string().optional(),
  integrationCredentialId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  removedAt: z.string().nullable().optional(),
});

export const agentGetByIdRoute = defineRoute({
  method: 'GET',
  url: '/:id',
  schema: {
    response: withErrorResponses(agentResponseSchema),
  },
  handler: async ({ headers, params }) => {
    const agentId = params?.id;
    if (!agentId || agentId === '') {
      throw new WrongParamError('Missing agent id');
    }
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { agent } = await agentService.getAgent({ userId, agentId });
    return agent;
  },
});
