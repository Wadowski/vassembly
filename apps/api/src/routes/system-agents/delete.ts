import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import systemAgentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

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
  assignedToolIds: z.array(z.string()),
});

export const systemAgentDeleteRoute = defineRoute({
  method: 'DELETE',
  url: '/:id',
  schema: {
    response: withErrorResponses(systemAgentAdminResponseSchema),
  },
  handler: async ({ headers, params }) => {
    const systemAgentId = params?.id;
    if (!systemAgentId || systemAgentId === '') {
      throw new WrongParamError('Missing system agent id');
    }

    const { userId } = await authHandlers.authorizeAdminRequest({ headers });
    const { systemAgent } = await systemAgentService.archiveSystemAgent({
      adminUserId: userId,
      systemAgentId,
    });

    return systemAgent;
  },
});
