import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { authorizeProtectedRequest } from '../shared/authorizeProtectedRequest';
import mcpService from '@vassembly/service-mcp';
import { withErrorResponses } from '../errorSchema';

import {
  mcpConfigurationFieldValuesSchema,
  mcpConfigurationResponseSchema,
} from './schemas';

export const updateMcpConfigurationBodySchema = z.object({
  fieldValues: mcpConfigurationFieldValuesSchema,
});

export const updateMcpConfigurationRoute = defineRoute({
  method: 'PATCH',
  url: '/:mcpId/configuration',
  schema: {
    body: updateMcpConfigurationBodySchema,
    response: withErrorResponses(mcpConfigurationResponseSchema),
  },
  handler: async ({ body, headers, params }) => {
    const mcpId = params?.mcpId;

    if (!mcpId || mcpId === '') {
      throw new WrongParamError('Missing mcpId');
    }

    const { userId } = await authorizeProtectedRequest({ headers });

    return mcpService.updateUserMcpConfiguration(
      { mcpId, fieldValues: body.fieldValues },
      { userId },
    );
  },
});
