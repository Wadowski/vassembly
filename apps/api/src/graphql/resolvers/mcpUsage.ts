import { applyResolvers } from '@vassembly/graphql';
import { UnauthorizedError } from '@vassembly/errors';
import mcpService from '@vassembly/service-mcp';
import { gqlSchema as gqlMcpUsageSchema } from '@vassembly/domain-mcp-usage';

import { enforceOnboardingCompleteForQuery } from '../shared/enforceOnboardingCompleteForQuery';

import type { Builder } from '@vassembly/graphql';
import type { ApiGraphQLContext } from '../shared/types';

interface McpUsageHistoryResolverArgs {
  mcpId: string;
  page?: number | null;
  size?: number | null;
}

export { gqlMcpUsageSchema };

export const registerMcpUsageResolvers = (builder: Builder): void => {
  gqlMcpUsageSchema(builder);

  applyResolvers({
    builder,
    queries: (t) => ({
      mcpUsageHistory: t.field({
        type: 'McpUsageHistoryList',
        args: {
          mcpId: t.arg.id({ required: true }),
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 20 }),
        },
        resolve: async (
          _root: unknown,
          args: McpUsageHistoryResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          enforceOnboardingCompleteForQuery({ queryName: 'mcpUsageHistory', context });
          const userId = context.authenticatedUserId;

          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          return mcpService.getMcpUsageHistory({
            mcpId: args.mcpId,
            userId,
            page: args.page ?? 0,
            size: args.size ?? 20,
          });
        },
      }),
    }),
  });
};
