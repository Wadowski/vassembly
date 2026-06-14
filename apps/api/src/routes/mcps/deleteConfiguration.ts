import { WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';

import { handlers as authHandlers } from '@vassembly/service-auth';
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

    const { userId } = await authHandlers.authorizeRequest({ headers });

    return mcpService.deleteUserMcpConfiguration({ mcpId }, { userId });
  },
});
