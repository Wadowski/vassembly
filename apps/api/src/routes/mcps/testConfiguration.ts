import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import mcpService from '@vassembly/service-mcp';
import { withErrorResponses } from '../errorSchema';

import {
  mcpConfigurationFieldValuesSchema,
  testMcpConfigurationResponseSchema,
} from './schemas';

export const testMcpConfigurationBodySchema = z.object({
  fieldValues: mcpConfigurationFieldValuesSchema.refine(
    (fieldValues) => Object.keys(fieldValues).length > 0,
    { message: 'fieldValues must contain at least one field' },
  ),
  useSavedSecrets: z.boolean().optional().default(false),
});

export const testMcpConfigurationRoute = defineRoute({
  method: 'POST',
  url: '/:mcpId/configuration/test',
  schema: {
    body: testMcpConfigurationBodySchema,
    response: withErrorResponses(testMcpConfigurationResponseSchema),
  },
  handler: async ({ body, headers, params }) => {
    const mcpId = params?.mcpId;

    if (!mcpId || mcpId === '') {
      throw new WrongParamError('Missing mcpId');
    }

    const { userId } = await authHandlers.authorizeRequest({ headers });

    return mcpService.testMcpConnection(
      {
        mcpId,
        fieldValues: body.fieldValues,
        useSavedSecrets: body.useSavedSecrets,
      },
      { userId },
    );
  },
});
