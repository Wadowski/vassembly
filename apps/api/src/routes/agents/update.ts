import { AgentCategory, AgentStatus } from '@vassembly/domain-agent';
import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';

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

export const agentPatchRoute = defineRoute({
  method: 'PATCH',
  url: '/:id',
  schema: { body: agentPatchBodySchema },
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
