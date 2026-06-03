import { AgentCategory, AgentStatus } from '@vassembly/domain-agent';
import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

export const agentPatchBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    category: z
      .enum(Object.values(AgentCategory) as [AgentCategory, ...AgentCategory[]])
      .optional(),
    description: z.string().min(1).max(500).optional(),
    rule: z.string().min(1).max(2000).optional(),
    status: z.enum(Object.values(AgentStatus) as [AgentStatus, ...AgentStatus[]]).optional(),
    integrationCredentialId: z.string().optional(),
  })
  .strict();

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

export const agentPatchRoute = defineRoute({
  method: 'PATCH',
  url: '/:id',
  schema: {
    body: agentPatchBodySchema,
    response: withErrorResponses(agentResponseSchema),
  },
  handler: async ({ body, headers, params }) => {
    const agentId = params?.id;
    if (!agentId || agentId === '') {
      throw new WrongParamError('Missing agent id');
    }
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { agent } = await agentService.updateAgent({
      userId,
      agentId,
      patch: body,
    });
    return agent;
  },
});
