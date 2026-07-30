import { applyResolvers } from '@vassembly/graphql';
import { gqlSchema as gqlMcpSchema } from '@vassembly/domain-mcp';
import { UnauthorizedError } from '@vassembly/errors';
import agentService from '@vassembly/service-agent';
import mcpService from '@vassembly/service-mcp';
import type { Builder } from '@vassembly/graphql';

import { enforceOnboardingCompleteForQuery } from '../shared/enforceOnboardingCompleteForQuery';
import type { ApiGraphQLContext } from '../shared/types';

interface McpsListResolverArgs {
  page?: number | null;
  size?: number | null;
  search?: string | null;
  tags?: string[] | null;
  specializationId?: string | null;
}

interface McpConfigurationResolverArgs {
  mcpId: string;
}

interface UserConfiguredMcpsResolverArgs {
  page?: number | null;
  size?: number | null;
}

interface McpWithAgentsResolverArgs {
  mcpId: string;
  page?: number | null;
  size?: number | null;
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
          specializationId: t.arg.string({ required: false }),
        },
        resolve: async (
          _root: unknown,
          args: McpsListResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          enforceOnboardingCompleteForQuery({ queryName: 'mcps', context });
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
              specializationId: args.specializationId ?? undefined,
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
          enforceOnboardingCompleteForQuery({ queryName: 'mcp', context });
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
          enforceOnboardingCompleteForQuery({ queryName: 'availableTags', context });
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
          enforceOnboardingCompleteForQuery({ queryName: 'mcpConfiguration', context });
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
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 20 }),
        },
        resolve: async (
          _root: unknown,
          args: UserConfiguredMcpsResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          enforceOnboardingCompleteForQuery({ queryName: 'userConfiguredMcps', context });
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Unauthorized');
          }

          const result = await mcpService.listUserMcpConfigurations(
            {
              page: args.page ?? undefined,
              size: args.size ?? undefined,
            },
            { userId },
          );

          return result;
        },
      }),
      mcpWithAgents: t.field({
        type: 'McpWithAgents',
        args: {
          mcpId: t.arg.string({ required: true }),
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 10 }),
        },
        resolve: async (
          _root: unknown,
          args: McpWithAgentsResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          enforceOnboardingCompleteForQuery({ queryName: 'mcpWithAgents', context });
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required to view MCP agents');
          }

          const result = await agentService.getMcpWithAgents({
            userId,
            mcpId: args.mcpId,
            page: args.page ?? 0,
            size: args.size ?? 10,
          });

          return {
            ...result,
            configurationStatus: 'configured',
            agentUsageCount: result.totalCount,
          };
        },
      }),
    }),
  });
};

export { gqlMcpSchema };
