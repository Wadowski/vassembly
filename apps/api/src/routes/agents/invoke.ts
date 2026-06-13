import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

export const INVOKE_AGENT_BODY_SCHEMA = z.object({
  message: z.string().min(1),
});

export const invokeAgentResponseSchema = z.object({
  message: z.string(),
  metadata: z
    .object({
      mcpIdsUsed: z.array(z.string()),
      skippedMcpIds: z.array(z.string()),
    })
    .optional(),
});

export const agentInvokeRoute = defineRoute({
  method: 'POST',
  url: '/:id/invoke',
  schema: {
    body: INVOKE_AGENT_BODY_SCHEMA,
    response: withErrorResponses(invokeAgentResponseSchema),
  },
  handler: async ({ body, headers, params }) => {
    const agentId = params?.id;
    if (!agentId || agentId === '') {
      throw new WrongParamError('Missing agent id');
    }

    const { userId } = await authHandlers.authorizeRequest({ headers });

    return agentService.invokePersonalAgent({
      userId,
      agentId,
      message: body.message,
    });
  },
});
