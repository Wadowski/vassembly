import { applyResolvers } from '@vassembly/graphql';
import type { AgentStatus } from '@vassembly/domain-system-agent';
import { UnauthorizedError } from '@vassembly/errors';
import systemAgentService from '@vassembly/service-agent';
import userDomain from '@vassembly/domain-user';
import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import type { Builder } from '@vassembly/graphql';

import { enforceOnboardingCompleteForQuery } from '../shared/enforceOnboardingCompleteForQuery';
import type { ApiGraphQLContext } from '../shared/types';

interface SystemAgentsListResolverArgs {
  page?: number | null;
  size?: number | null;
  search?: string | null;
  status?: string | null;
}

interface AgentsBySpecializationResolverArgs {
  specializationId: string;
  page?: number | null;
  size?: number | null;
  search?: string | null;
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
          enforceOnboardingCompleteForQuery({ queryName: 'systemAgents', context });
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

      agentsBySpecialization: t.field({
        type: 'SystemAgentsList',
        args: {
          specializationId: t.arg.string({ required: true }),
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 10 }),
          search: t.arg.string({ required: false }),
        },
        resolve: async (
          _root: unknown,
          args: AgentsBySpecializationResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          enforceOnboardingCompleteForQuery({ queryName: 'agentsBySpecialization', context });
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          const result = await systemAgentService.listAgentsBySpecialization({
            adminUserId: userId,
            specializationId: args.specializationId,
            page: args.page ?? 0,
            size: args.size ?? 10,
            search: args.search ?? undefined,
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
          enforceOnboardingCompleteForQuery({ queryName: 'systemAgentPreference', context });
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
