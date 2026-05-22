import { AgentCategory } from '@vassembly/domain-agent';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';

export const agentCreateBodySchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(Object.values(AgentCategory) as [AgentCategory, ...AgentCategory[]]),
  description: z.string().min(1).max(500),
  rule: z.string().min(1).max(2000),
});

export const agentCreateRoute = defineRoute({
  method: 'POST',
  url: '/',
  statusCode: 201,
  schema: { body: agentCreateBodySchema },
  handler: async ({ body, headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });
    const { agent } = await agentService.createAgent({ userId, body });
    return agent;
  },
});
