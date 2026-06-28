import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { authorizeProtectedRequest } from '../shared/authorizeProtectedRequest';
import mcpService from '@vassembly/service-mcp';
import { withErrorResponses } from '../errorSchema';

import { deleteMcpConfigurationResponseSchema } from './schemas';

export const deleteMcpConfigurationRoute = defineRoute({
  method: 'DELETE',
  url: '/:mcpId/configuration',
  schema: {
    response: withErrorResponses(deleteMcpConfigurationResponseSchema),
  },
  handler: async ({ headers, params }) => {
    const mcpId = params?.mcpId;

    if (!mcpId || mcpId === '') {
      throw new WrongParamError('Missing mcpId');
    }

    const { userId } = await authorizeProtectedRequest({ headers });

    return mcpService.deleteUserMcpConfiguration({ mcpId }, { userId });
  },
});
