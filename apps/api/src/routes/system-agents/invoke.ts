import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { authorizeProtectedRequest } from '../shared/authorizeProtectedRequest';
import systemAgentService from '@vassembly/service-agent';
import { withErrorResponses } from '../errorSchema';

import { INVOKE_SYSTEM_AGENT_BODY_SCHEMA } from './schemas';

export const invokeSystemAgentResponseSchema = z.object({
  message: z.string(),
  usage: z
    .object({
      promptTokens: z.number(),
      completionTokens: z.number(),
      totalTokens: z.number(),
    })
    .optional(),
  metadata: z
    .object({
      model: z.string().optional(),
      provider: z.string().optional(),
      mcpIdsUsed: z.array(z.string()).optional(),
      skippedMcpIds: z.array(z.string()).optional(),
      internalToolIdsUsed: z.array(z.string()).optional(),
      skippedInternalToolIds: z.array(z.string()).optional(),
      maxUseAgentDepth: z.number().optional(),
    })
    .optional(),
});

export const systemAgentInvokeRoute = defineRoute({
  method: 'POST',
  url: '/:id/invoke',
  schema: {
    body: INVOKE_SYSTEM_AGENT_BODY_SCHEMA,
    response: withErrorResponses(invokeSystemAgentResponseSchema),
  },
  handler: async ({ body, headers, params }) => {
    const systemAgentId = params?.id;
    if (!systemAgentId || systemAgentId === '') {
      throw new WrongParamError('Missing system agent id');
    }

    const { userId } = await authorizeProtectedRequest({ headers });

    return systemAgentService.invokeSystemAgent({
      userId,
      systemAgentId,
      message: body.message,
      connectionOverride: body.connectionOverride,
    });
  },
});
