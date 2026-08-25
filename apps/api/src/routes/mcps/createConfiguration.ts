import { ValidationError, WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers as authHandlers } from '@vassembly/service-auth';
import mcpService from '@vassembly/service-mcp';
import { withErrorResponses } from '../errorSchema';

import {
  mcpConfigurationFieldValuesSchema,
  mcpConfigurationResponseSchema,
} from './schemas';

export const createMcpConfigurationBodySchema = z.object({
  fieldValues: mcpConfigurationFieldValuesSchema,
});

export const createMcpConfigurationRoute = defineRoute({
  method: 'POST',
  url: '/:mcpId/configuration',
  statusCode: 201,
  schema: {
    body: createMcpConfigurationBodySchema,
    response: withErrorResponses(mcpConfigurationResponseSchema, 201),
  },
  handler: async ({ body, headers, params }) => {
    const mcpId = params?.mcpId;

    if (!mcpId || mcpId === '') {
      throw new WrongParamError('Missing mcpId');
    }

    const { userId } = await authHandlers.authorizeRequest({ headers });

    try {
      return await mcpService.createUserMcpConfiguration(
        { mcpId, fieldValues: body.fieldValues },
        { userId },
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new WrongParamError(error.message);
      }

      throw error;
    }
  },
});
