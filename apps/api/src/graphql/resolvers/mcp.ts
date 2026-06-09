import { applyResolvers } from '@vassembly/graphql';
import { gqlSchema as gqlMcpSchema } from '@vassembly/domain-mcp';
import { UnauthorizedError } from '@vassembly/errors';
import mcpService from '@vassembly/service-mcp';
import type { Builder } from '@vassembly/graphql';

interface McpsListResolverArgs {
  page?: number | null;
  size?: number | null;
  search?: string | null;
  tags?: string[] | null;
}

interface McpConfigurationResolverArgs {
  mcpId: string;
}

interface UserConfiguredMcpsResolverArgs {
  limit?: number | null;
  offset?: number | null;
}

interface ApiGraphQLContext {
  authenticatedUserId?: string;
}

export const registerMcpResolvers = (builder: Builder): void => {
  applyResolvers({
    builder,
    queries: (t) => ({
      mcps: t.field({
        type: 'McpsList',
        args: {
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 20 }),
          search: t.arg.string({ required: false }),
          tags: t.arg.stringList({ required: false }),
        },
        resolve: async (
          _root: unknown,
          args: McpsListResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required to view MCPs');
          }

          return mcpService.listMcps(
            {
              page: args.page ?? 0,
              size: args.size ?? 20,
              search: args.search ?? undefined,
              tags: args.tags ?? undefined,
            },
            { authenticatedUserId: userId },
          );
        },
      }),
      mcp: t.field({
        type: 'Mcp',
        nullable: true,
        args: {
          id: t.arg.string({ required: true }),
        },
        resolve: async (
          _root: unknown,
          args: { id: string },
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required to view MCP');
          }

          const result = await mcpService.getMcp({ id: args.id }, { authenticatedUserId: userId });
          return result.data;
        },
      }),
      availableTags: t.field({
        type: 'AvailableTags',
        resolve: async (_root: unknown, _args: unknown, context: ApiGraphQLContext) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required to view available tags');
          }

          return mcpService.getAvailableTags({}, { authenticatedUserId: userId });
        },
      }),
      mcpConfiguration: t.field({
        type: 'UserMcpConfig',
        nullable: true,
        args: {
          mcpId: t.arg.string({ required: true }),
        },
        resolve: async (
          _root: unknown,
          args: McpConfigurationResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Unauthorized');
          }

          return mcpService.getUserMcpConfiguration({ mcpId: args.mcpId }, { userId });
        },
      }),
      userConfiguredMcps: t.field({
        type: 'UserMcpConfigList',
        args: {
          limit: t.arg.int({ required: false }),
          offset: t.arg.int({ required: false }),
        },
        resolve: async (
          _root: unknown,
          args: UserConfiguredMcpsResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Unauthorized');
          }

          const configs = await mcpService.listUserMcpConfigurations(
            { limit: args.limit ?? undefined },
            { userId },
          );

          return { items: configs };
        },
      }),
    }),
  });
};

export { gqlMcpSchema };
