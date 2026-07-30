import taskDomain from '@vassembly/domain-task';
import taskCommentDomain from '@vassembly/domain-task-comment';
import taskPlanInstanceDomain from '@vassembly/domain-task-plan-instance';
import taskPlanTemplateDomain from '@vassembly/domain-task-plan-template';
import mcpUsageDomain from '@vassembly/domain-mcp-usage';
import internalToolUsageDomain from '@vassembly/domain-internal-tool-usage';
import taskQuestionsDomain from '@vassembly/domain-task-questions';
import { NotFoundError } from '@vassembly/errors';
import { toIsoString } from '@vassembly/mappers';

import { mapInternalToolUsageEventsToTimelineItems } from './mapInternalToolUsageEventsToTimelineItems';
import { mapMcpUsageEventsToTimelineItems } from './mapMcpUsageEventsToTimelineItems';
import { mapProgressStateToFilterGroup } from './types';
import { aggregateProgressStats } from './aggregateProgressStats';
import { resolveCommentProgress } from './resolveCommentProgress';

import type {
  GetTaskActivityTimelineHandlerInput,
  GetTaskActivityTimelineHandlerOutput,
  TaskActivityItem,
} from './types';

const sortTimelineItems = (items: TaskActivityItem[]): TaskActivityItem[] => {
  return [...items].sort((left, right) => {
    const timeDelta = right.occurredAt.localeCompare(left.occurredAt);

    if (timeDelta !== 0) {
      return timeDelta;
    }

    return right.sortKey.localeCompare(left.sortKey);
  });
};

export const getTaskActivityTimeline = async ({
  userId,
  taskId,
}: GetTaskActivityTimelineHandlerInput): Promise<GetTaskActivityTimelineHandlerOutput> => {
  const taskResult = await taskDomain.queries.getModelById({ id: taskId });
  const task = taskResult.data;

  if (!task || task.userId !== userId) {
    throw new NotFoundError('Task not found');
  }

  const commentsResult = await taskCommentDomain.queries.listByTaskId({ taskId });
  const questionsResult = await taskQuestionsDomain.queries.getTaskQuestions({ taskId });
  const mcpUsageResult = await mcpUsageDomain.queries.getModelsByTaskId({ taskId });
  const internalToolUsageResult = await internalToolUsageDomain.queries.getModelsByTaskId({
    taskId,
  });
  const answeredQuestions = questionsResult.data?.answeredQuestions ?? [];

  const items: TaskActivityItem[] = [];

  const comments = commentsResult.data;
  const commentCount = comments.length;

  for (const [commentIndex, comment] of comments.entries()) {
    const commentId = comment.id!;

    items.push({
      kind: 'userComment',
      id: `user-comment-${commentId}`,
      occurredAt: toIsoString({ value: comment.createdAt!, fieldName: 'createdAt' }),
      sortKey: commentId,
      filterGroup: 'comments',
      commentId,
      userText: comment.userText!,
      specializationIds: comment.specializationIds ?? [],
      commentSkillIds: comment.skillIdsUsed ?? [],
    });

    if (comment.taskPlanInstanceId) {
      const instanceResult = await taskPlanInstanceDomain.queries.getModelById({
        id: comment.taskPlanInstanceId,
      });
      const templateResult = await taskPlanTemplateDomain.queries.getModelById({
        id: instanceResult.data.taskPlanTemplateId!,
      });

      items.push({
        kind: 'plan',
        id: `plan-${commentId}`,
        occurredAt: toIsoString({
          value: instanceResult.data.createdAt!,
          fieldName: 'createdAt',
        }),
        sortKey: `${commentId}-plan`,
        filterGroup: 'plans',
        commentId,
        commentSkillIds: comment.skillIdsUsed ?? [],
        planTemplateShortName: templateResult.data.shortName!,
        planTemplateDescription: templateResult.data.description!,
        planInstanceStatus: instanceResult.data.status!,
        planItems: (instanceResult.data.items ?? []).map((item) => ({
          templateItemIndex: item.templateItemIndex,
          agentId: item.agentId,
          skillId: item.skillId,
          order: item.order,
          status: item.status,
          startedAt: item.startedAt
            ? toIsoString({ value: item.startedAt, fieldName: 'startedAt' })
            : null,
          completedAt: item.completedAt
            ? toIsoString({ value: item.completedAt, fieldName: 'completedAt' })
            : null,
          failedAt: item.failedAt
            ? toIsoString({ value: item.failedAt, fieldName: 'failedAt' })
            : null,
          errorMessage: item.errorMessage,
          retryCount: item.retryCount,
          description:
            templateResult.data.items?.[item.templateItemIndex]?.description ?? '',
        })),
        planTemplate: {
          shortName: templateResult.data.shortName!,
          description: templateResult.data.description!,
          inputDetails: templateResult.data.inputDetails ?? {},
          outputDetails: templateResult.data.outputDetails ?? {},
        },
        planInstance: {
          status: instanceResult.data.status!,
          inputDetails: instanceResult.data.inputDetails ?? {},
        },
      });
    }

    const commentProgress = await resolveCommentProgress({
      taskId,
      commentId,
      commentIndex,
      commentCount,
    });
    const events = commentProgress?.events ?? [];
    const executionStats = aggregateProgressStats(commentProgress);

    for (const event of events) {
      const eventId = event.id;
      items.push({
        kind: 'progressEvent',
        id: `progress-${commentId}-${eventId}`,
        occurredAt: toIsoString({ value: event.timestamp, fieldName: 'timestamp' }),
        sortKey: `${commentId}-${eventId}`,
        filterGroup: mapProgressStateToFilterGroup({ state: event.state }),
        commentId,
        eventId,
        agentId: event.agentId,
        state: event.state,
        timestamp: toIsoString({ value: event.timestamp, fieldName: 'timestamp' }),
        duration: event.duration,
        inputMessages: event.inputMessages,
        generatedResponse: event.generatedResponse,
        tokenUsage: event.tokenUsage,
        errorDetails: event.errorDetails,
        integrationName: event.integrationName,
        provider: event.provider,
        model: event.model,
        outcomeSummary: event.outcomeSummary,
      });
    }

    const commentAnswered = answeredQuestions.filter(
      (question) => question.commentId === commentId,
    );

    for (const answered of commentAnswered) {
      const answerText = Array.isArray(answered.answer)
        ? answered.answer.join(', ')
        : String(answered.answer);

      items.push({
        kind: 'hitlAnswered',
        id: `hitl-${answered.questionId}`,
        occurredAt: toIsoString({ value: answered.answeredAt, fieldName: 'answeredAt' }),
        sortKey: answered.questionId,
        filterGroup: 'questions',
        commentId,
        questionId: answered.questionId,
        question: answered.question,
        answer: answerText,
      });
    }

    if (comment.agentResponse) {
      items.push({
        kind: 'agentResponse',
        id: `agent-response-${commentId}`,
        occurredAt: toIsoString({ value: comment.updatedAt!, fieldName: 'updatedAt' }),
        sortKey: commentId,
        filterGroup: 'responses',
        commentId,
        agentResponse: comment.agentResponse,
        commentSkillIds: comment.skillIdsUsed ?? [],
        totalDuration: executionStats.totalDuration,
        totalTokens: executionStats.totalTokens,
      });
    }
  }

  items.push(
    ...mapMcpUsageEventsToTimelineItems({
      events: mcpUsageResult.data,
    }),
    ...mapInternalToolUsageEventsToTimelineItems({
      events: internalToolUsageResult.data,
    }),
  );

  return {
    items: sortTimelineItems(items),
  };
};
