import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

import { CREATE_SYSTEM_AGENT_BODY_SCHEMA } from './schemas';

export const systemAgentAdminResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  rule: z.string(),
  category: z.string().optional(),
  status: z.string(),
  createdByAdminId: z.string(),
  updatedByAdminId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  removedAt: z.string().nullable(),
});

export const systemAgentCreateRoute = defineRoute({
  method: 'POST',
  url: '/',
  statusCode: 201,
  schema: {
    body: CREATE_SYSTEM_AGENT_BODY_SCHEMA,
    response: withErrorResponses(systemAgentAdminResponseSchema, 201),
  },
  handler: async ({ body, headers }) => {
    const { userId } = await authHandlers.authorizeAdminRequest({ headers });
    const { systemAgent } = await systemAgentService.createSystemAgent({
      adminUserId: userId,
      body,
    });

    return systemAgent;
  },
});
