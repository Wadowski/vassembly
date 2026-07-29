import { applyResolvers, defineObjectType, graphQLListType } from '@vassembly/graphql';
import { UnauthorizedError } from '@vassembly/errors';
import taskService from '@vassembly/service-task';
import type { TaskActivityItem } from '@vassembly/service-task';
import type { Builder } from '@vassembly/graphql';

import { enforceOnboardingCompleteForQuery } from '../shared/enforceOnboardingCompleteForQuery';
import { resolveAgentDisplayNames } from './shared/resolveAgentDisplayName';
import { resolveSkillDisplayNames } from './shared/resolveSkillDisplayName';
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
      specializationIds: t.field({
        type: graphQLListType('String'),
        nullable: true,
        resolve: (parent: { specializationIds?: string[] | null }) => parent.specializationIds ?? null,
      }),
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
      usageEventId: t.exposeString('usageEventId', { nullable: true }),
      mcpId: t.exposeString('mcpId', { nullable: true }),
      mcpName: t.exposeString('mcpName', { nullable: true }),
      internalToolId: t.exposeString('internalToolId', { nullable: true }),
      internalToolDisplayName: t.exposeString('internalToolDisplayName', { nullable: true }),
      toolDisplayName: t.exposeString('toolDisplayName', { nullable: true }),
      toolName: t.exposeString('toolName', { nullable: true }),
      status: t.exposeString('status', { nullable: true }),
      startedAt: t.exposeString('startedAt', { nullable: true }),
      endedAt: t.exposeString('endedAt', { nullable: true }),
      durationMs: t.exposeInt('durationMs', { nullable: true }),
      input: t.exposeString('input', { nullable: true }),
      inputTruncated: t.exposeBoolean('inputTruncated', { nullable: true }),
      output: t.exposeString('output', { nullable: true }),
      outputTruncated: t.exposeBoolean('outputTruncated', { nullable: true }),
      invocationId: t.exposeString('invocationId', { nullable: true }),
      rootInvokeId: t.exposeString('rootInvokeId', { nullable: true }),
      errorMessage: t.exposeString('errorMessage', { nullable: true }),
      errorDetails: t.expose('errorDetails', { type: 'ErrorDetails', nullable: true }),
      commentSkillIds: t.field({
        type: graphQLListType('String'),
        nullable: true,
        resolve: (parent: { commentSkillIds?: string[] | null }) => parent.commentSkillIds ?? null,
      }),
      planTemplateShortName: t.exposeString('planTemplateShortName', { nullable: true }),
      planTemplateDescription: t.exposeString('planTemplateDescription', { nullable: true }),
      planInstanceStatus: t.exposeString('planInstanceStatus', { nullable: true }),
      planItems: t.field({
        type: graphQLListType('TaskPlanInstanceItem'),
        nullable: true,
        resolve: (parent: { planItems?: object[] | null }) => parent.planItems ?? null,
      }),
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

          const toolCallAgentIds = timeline.items
            .filter((item) => item.kind === 'mcpInvocation' || item.kind === 'toolInvocation')
            .map((item) => item.agentId);

          const planAgentIds = timeline.items
            .filter((item) => item.kind === 'plan')
            .flatMap((item) => item.planItems?.map((planItem) => planItem.agentId) ?? []);

          const planSkillIds = timeline.items
            .filter((item) => item.kind === 'plan')
            .flatMap(
              (item) =>
                item.planItems
                  ?.map((planItem) => planItem.skillId)
                  .filter((skillId): skillId is string => skillId !== null) ?? [],
            );

          const [agentNameById, skillNameById] = await Promise.all([
            resolveAgentDisplayNames({
              agentIds: [...progressAgentIds, ...toolCallAgentIds, ...planAgentIds],
              userId,
            }),
            resolveSkillDisplayNames({ skillIds: planSkillIds }),
          ]);

          const items = timeline.items.map((item) => {
            if (item.kind === 'progressEvent') {
              return {
                ...item,
                agentName: agentNameById.get(item.agentId) ?? 'Unknown agent',
              };
            }

            if (item.kind === 'mcpInvocation' || item.kind === 'toolInvocation') {
              return {
                ...item,
                agentName: agentNameById.get(item.agentId) ?? 'Unknown agent',
              };
            }

            if (item.kind === 'plan') {
              return {
                ...item,
                planItems: item.planItems.map((planItem) => ({
                  ...planItem,
                  agentName: agentNameById.get(planItem.agentId) ?? planItem.agentId,
                  skillName: planItem.skillId
                    ? skillNameById.get(planItem.skillId) ?? null
                    : null,
                })),
              };
            }

            return item;
          });

          return { items };
        },
      }),
    }),
  });
};
