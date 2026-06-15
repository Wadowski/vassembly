import { applyResolvers } from '@vassembly/graphql';
import { ForbiddenError, NotFoundError } from '@vassembly/errors';
import { UnauthorizedError } from '@vassembly/errors';
import * as taskProgressDomain from '@vassembly/domain-task-progress';
import type { ProgressEventResponse } from '@vassembly/domain-task-progress';
import type { Builder } from '@vassembly/graphql';

import { resolveAgentDisplayNames } from './shared/resolveAgentDisplayName';

interface TaskProgressResolverArgs {
  taskId: string;
}

interface ApiGraphQLContext {
  authenticatedUserId?: string;
}

const enrichProgressEventsWithAgentNames = async ({
  events,
  userId,
}: {
  events: ProgressEventResponse[];
  userId: string;
}): Promise<ProgressEventResponse[]> => {
  const agentIds = events.map((event) => event.agentId);
  const nameMap = await resolveAgentDisplayNames({ agentIds, userId });

  return events.map((event) => ({
    ...event,
    agentName: nameMap.get(event.agentId) ?? 'Unknown agent',
  }));
};

export const registerTaskProgressResolvers = (builder: Builder): void => {
  applyResolvers({
    builder,
    queries: (t) => ({
      taskProgress: t.field({
        type: 'TaskProgress',
        args: {
          taskId: t.arg.id({ required: true }),
        },
        resolve: async (
          _root: unknown,
          args: TaskProgressResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;

          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          const result = await taskProgressDomain.queries.getTaskProgressByTaskId({
            taskId: args.taskId,
            userId,
          });

          if (!result.data) {
            throw new NotFoundError('Task progress not found');
          }

          const events = await enrichProgressEventsWithAgentNames({
            events: result.data.events,
            userId,
          });

          return {
            ...result.data,
            events,
          };
        },
      }),
    }),
  });
};
