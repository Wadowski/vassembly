import { applyResolvers } from '@vassembly/graphql';
import { AGENT_LIST_ALL_STATUSES, AgentStatus, toAgentResponse } from '@vassembly/domain-agent';
import type { AgentModel } from '@vassembly/domain-agent';
import { UnauthorizedError } from '@vassembly/errors';
import agentService from '@vassembly/service-agent';
import type { Builder } from '@vassembly/graphql';

interface AgentsListResolverArgs {
  page?: number | null;
  size?: number | null;
  search?: string | null;
  status?: string | null;
}

interface ApiGraphQLContext {
  authenticatedUserId?: string;
}

export const registerAgentResolvers = (builder: Builder): void => {
  applyResolvers({
    builder,
    queries: (t) => ({
      agents: t.field({
        type: 'AgentsList',
        args: {
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 10 }),
          search: t.arg.string({ required: false }),
          status: t.arg.string({ required: false }),
        },
        resolve: async (
          _root: unknown,
          args: AgentsListResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;
          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          const status =
            args.status === AGENT_LIST_ALL_STATUSES
              ? AGENT_LIST_ALL_STATUSES
              : args.status && (Object.values(AgentStatus) as string[]).includes(args.status)
                ? (args.status as AgentStatus)
                : undefined;

          const result = await agentService.listAgents({
            userId,
            page: args.page ?? 0,
            size: args.size ?? 10,
            search: args.search ?? undefined,
            status,
          });

          return {
            items: result.items.map((item) => toAgentResponse(item as AgentModel)),
            totalCount: result.totalCount,
            page: result.page,
            size: result.size,
          };
        },
      }),
    }),
  });
};
