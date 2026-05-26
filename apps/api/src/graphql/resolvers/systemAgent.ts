import { applyResolvers } from '@vassembly/graphql';
import type { AgentStatus } from '@vassembly/domain-system-agent';
import { UnauthorizedError } from '@vassembly/errors';
import systemAgentService from '@vassembly/service-agent';
import userDomain from '@vassembly/domain-user';
import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import type { Builder } from '@vassembly/graphql';

interface SystemAgentsListResolverArgs {
  page?: number | null;
  size?: number | null;
  search?: string | null;
  status?: string | null;
}

interface ApiGraphQLContext {
  authenticatedUserId?: string;
}

export const registerSystemAgentResolvers = (builder: Builder): void => {
  applyResolvers({
    builder,
    queries: (t) => ({
      systemAgents: t.field({
        type: 'SystemAgentsList',
        args: {
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 10 }),
          search: t.arg.string({ required: false }),
          status: t.arg.string({ required: false }),
        },
        resolve: async (
          _root: unknown,
          args: SystemAgentsListResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          await userDomain.queries.assertHasRole({
            userId,
            role: AUTH_TOKEN_ROLE.ADMIN,
          });

          const result = await systemAgentService.listSystemAgents({
            adminUserId: userId,
            page: args.page ?? 0,
            size: args.size ?? 10,
            search: args.search ?? undefined,
            status: args.status as AgentStatus | undefined,
          });

          return {
            items: result.items,
            total: result.total,
            page: result.page,
            size: result.size,
          };
        },
      }),

      systemAgentPreference: t.field({
        type: 'SystemAgentPreference',
        resolve: async (_root: unknown, _args: unknown, context: ApiGraphQLContext) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          const result = await systemAgentService.getUserConnectionPreference({
            adminUserId: userId,
            targetUserId: userId,
          });

          return result.preference;
        },
      }),
    }),
  });
};
