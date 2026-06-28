import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { authorizeProtectedRequest } from '../shared/authorizeProtectedRequest';
import agentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

export const INVOKE_AGENT_BODY_SCHEMA = z.object({
  message: z.string().min(1),
});

export const invokeAgentResponseSchema = z.object({
  message: z.string(),
  metadata: z
    .object({
      mcpIdsUsed: z.array(z.string()).optional(),
      skippedMcpIds: z.array(z.string()).optional(),
      internalToolIdsUsed: z.array(z.string()).optional(),
      skippedInternalToolIds: z.array(z.string()).optional(),
      maxUseAgentDepth: z.number().optional(),
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

    const { userId } = await authorizeProtectedRequest({ headers });

    return agentService.invokePersonalAgent({
      userId,
      agentId,
      message: body.message,
    });
  },
});
