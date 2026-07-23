import { applyResolvers, defineObjectType } from '@vassembly/graphql';
import { UnauthorizedError } from '@vassembly/errors';
import taskService from '@vassembly/service-task';
import type { TaskActivityItem } from '@vassembly/service-task';
import type { Builder } from '@vassembly/graphql';

import { enforceOnboardingCompleteForQuery } from '../shared/enforceOnboardingCompleteForQuery';
import { resolveAgentDisplayNames } from './shared/resolveAgentDisplayName';
import type { ApiGraphQLContext } from '../shared/types';

interface TaskActivityTimelineResolverArgs {
  taskId: string;
}

export const registerTaskActivityResolvers = (builder: Builder): void => {
  defineObjectType(builder, 'TaskActivityItem', {
    fields: (t) => ({
      kind: t.exposeString('kind'),
      id: t.exposeString('id'),
      occurredAt: t.exposeString('occurredAt'),
      sortKey: t.exposeString('sortKey'),
      filterGroup: t.exposeString('filterGroup'),
      commentId: t.exposeString('commentId', { nullable: true }),
      userText: t.exposeString('userText', { nullable: true }),
      agentResponse: t.exposeString('agentResponse', { nullable: true }),
      totalDuration: t.exposeInt('totalDuration', { nullable: true }),
      totalTokens: t.expose('totalTokens', { type: 'TokenUsage', nullable: true }),
      questionId: t.exposeString('questionId', { nullable: true }),
      question: t.exposeString('question', { nullable: true }),
      answer: t.exposeString('answer', { nullable: true }),
      eventId: t.exposeString('eventId', { nullable: true }),
      agentId: t.exposeString('agentId', { nullable: true }),
      agentName: t.exposeString('agentName', { nullable: true }),
      state: t.exposeString('state', { nullable: true }),
      timestamp: t.exposeString('timestamp', { nullable: true }),
      duration: t.exposeFloat('duration', { nullable: true }),
      tokenUsage: t.expose('tokenUsage', { type: 'TokenUsage', nullable: true }),
      inputMessages: t.exposeString('inputMessages', { nullable: true }),
      generatedResponse: t.exposeString('generatedResponse', { nullable: true }),
      integrationName: t.exposeString('integrationName', { nullable: true }),
      provider: t.exposeString('provider', { nullable: true }),
      model: t.exposeString('model', { nullable: true }),
    }),
  });

  defineObjectType(builder, 'TaskActivityTimeline', {
    fields: (t) => ({
      items: t.field({
        type: ['TaskActivityItem'],
        resolve: (parent: { items: TaskActivityItem[] }) => parent.items,
      }),
    }),
  });

  applyResolvers({
    builder,
    queries: (t) => ({
      taskActivityTimeline: t.field({
        type: 'TaskActivityTimeline',
        args: {
          taskId: t.arg.id({ required: true }),
        },
        resolve: async (
          _root: unknown,
          args: TaskActivityTimelineResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          enforceOnboardingCompleteForQuery({ queryName: 'taskActivityTimeline', context });
          const userId = context.authenticatedUserId;

          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          const timeline = await taskService.getTaskActivityTimeline({
            userId,
            taskId: args.taskId,
          });

          const progressAgentIds = timeline.items
            .filter((item) => item.kind === 'progressEvent')
            .map((item) => item.agentId);

          const agentNameById = await resolveAgentDisplayNames({
            agentIds: progressAgentIds,
            userId,
          });

          const items = timeline.items.map((item) => {
            if (item.kind !== 'progressEvent') {
              return item;
            }

            return {
              ...item,
              agentName: agentNameById.get(item.agentId) ?? 'Unknown agent',
            };
          });

          return { items };
        },
      }),
    }),
  });
};
