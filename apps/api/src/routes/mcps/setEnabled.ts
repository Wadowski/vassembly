import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import mcpService from '@vassembly/service-mcp';
import { authorizeProtectedRequest } from '../shared/authorizeProtectedRequest';
import { withErrorResponses } from '../errorSchema';

export const setMcpEnabledBodySchema = z.object({
  enabled: z.boolean(),
});

export const setMcpEnabledResponseSchema = z.object({
  mcpId: z.string(),
  enabled: z.boolean(),
});

export const setMcpEnabledRoute = defineRoute({
  method: 'PATCH',
  url: '/:mcpId/enabled',
  schema: {
    body: setMcpEnabledBodySchema,
    response: withErrorResponses(setMcpEnabledResponseSchema),
  },
  handler: async ({ body, headers, params }) => {
    const mcpId = params?.mcpId;

    if (!mcpId || mcpId === '') {
      throw new WrongParamError('Missing mcpId');
    }

    const { userId } = await authorizeProtectedRequest({ headers });

    return mcpService.setUserMcpEnabled({ mcpId, enabled: body.enabled }, { userId });
  },
});
