import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import mcpService from '@vassembly/service-mcp';
import { withErrorResponses } from '../errorSchema';

export const setZeroConfigMcpsEnabledBodySchema = z.object({
  enabled: z.boolean(),
});

export const setZeroConfigMcpsEnabledResponseSchema = z.object({
  enabled: z.boolean(),
  mcpIds: z.array(z.string()),
  updatedCount: z.number(),
});

export const setZeroConfigMcpsEnabledRoute = defineRoute({
  method: 'PATCH',
  url: '/zero-config/enabled',
  schema: {
    body: setZeroConfigMcpsEnabledBodySchema,
    response: withErrorResponses(setZeroConfigMcpsEnabledResponseSchema),
  },
  handler: async ({ body, headers }) => {
    const { userId } = await authHandlers.authorizeRequest({ headers });

    return mcpService.setZeroConfigMcpsEnabled({ enabled: body.enabled }, { userId });
  },
});
