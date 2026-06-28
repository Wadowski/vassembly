import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { authorizeProtectedRequest } from '../shared/authorizeProtectedRequest';
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
  assignedMcpIds: z.array(z.string()),
  assignedToolIds: z.array(z.string()),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  removedAt: z.string().nullable().optional(),
});

export const agentRestoreRoute = defineRoute({
  method: 'POST',
  url: '/:id/restore',
  schema: {
    response: withErrorResponses(agentResponseSchema),
  },
  handler: async ({ headers, params }) => {
    const agentId = params?.id;
    if (!agentId || agentId === '') {
      throw new WrongParamError('Missing agent id');
    }
    const { userId } = await authorizeProtectedRequest({ headers });
    const { agent } = await agentService.restoreAgent({ userId, agentId });
    return agent;
  },
});
