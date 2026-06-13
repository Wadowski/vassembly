import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

import { agentResponseSchema } from '../agents/create';

const unassignMcpFromAgentResponseSchema = z.object({
  agent: agentResponseSchema,
});

export const unassignMcpFromAgentRoute = defineRoute({
  method: 'DELETE',
  url: '/:mcpId/agents/:agentId',
  schema: {
    response: withErrorResponses(unassignMcpFromAgentResponseSchema),
  },
  handler: async ({ headers, params }) => {
    const mcpId = params?.mcpId;
    const agentId = params?.agentId;

    if (!mcpId || mcpId === '') {
      throw new WrongParamError('Missing mcpId');
    }

    if (!agentId || agentId === '') {
      throw new WrongParamError('Missing agentId');
    }

    const { userId } = await authHandlers.authorizeRequest({ headers });

    const { agent } = await agentService.unassignMcpFromAgent({
      userId,
      mcpId,
      agentId,
    });

    return { agent };
  },
});
