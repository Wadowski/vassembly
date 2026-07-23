import { applyResolvers } from '@vassembly/graphql';
import { NotFoundError } from '@vassembly/errors';
import { UnauthorizedError } from '@vassembly/errors';
import * as taskProgressDomain from '@vassembly/domain-task-progress';
import type { ProgressEventResponse } from '@vassembly/domain-task-progress';
import type { Builder } from '@vassembly/graphql';

import { enforceOnboardingCompleteForQuery } from '../shared/enforceOnboardingCompleteForQuery';
import { resolveAgentDisplayNames } from './shared/resolveAgentDisplayName';
import type { ApiGraphQLContext } from '../shared/types';

interface TaskProgressByCommentResolverArgs {
  taskId: string;
  commentId: string;
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
      taskProgressByComment: t.field({
        type: 'TaskProgress',
        args: {
          taskId: t.arg.id({ required: true }),
          commentId: t.arg.id({ required: true }),
        },
        resolve: async (
          _root: unknown,
          args: TaskProgressByCommentResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          enforceOnboardingCompleteForQuery({ queryName: 'taskProgressByComment', context });
          const userId = context.authenticatedUserId;

          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          const result = await taskProgressDomain.queries.getTaskProgressByCommentId({
            taskId: args.taskId,
            commentId: args.commentId,
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
