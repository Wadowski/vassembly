import taskDomain from '@vassembly/domain-task';
import taskQuestionsDomain, { toTaskQuestionsResponse } from '@vassembly/domain-task-questions';
import { NotFoundError } from '@vassembly/errors';
import { logger } from '@vassembly/logger';
import { invocationResumeRegistry } from '@vassembly/service-agent';
import taskService from '@vassembly/service-task';

import type { SubmitAnswerHandlerInput, SubmitAnswerHandlerOutput } from './types';

export const submitAnswer = async ({
  userId,
  taskId,
  questionId,
  answer,
}: SubmitAnswerHandlerInput): Promise<SubmitAnswerHandlerOutput> => {
  const taskResult = await taskDomain.queries.getModelById({ id: taskId });
  const task = taskResult.data;

  if (!task || task.userId !== userId) {
    throw new NotFoundError('Task not found');
  }

  const submitResult = await taskQuestionsDomain.commands.submitAnswer({
    taskId,
    questionId,
    answer,
  });
  const submittedTaskQuestions = submitResult.data;

  if ((submittedTaskQuestions.pendingQuestions?.length ?? 0) > 0) {
    return {
      taskQuestions: toTaskQuestionsResponse({ taskQuestions: submittedTaskQuestions }),
    };
  }

  await taskDomain.commands.markInProgressFromWaiting({ taskId });

  const blockedInvocations = submittedTaskQuestions.blockedInvocations ?? [];
  const answeredQuestions = submittedTaskQuestions.answeredQuestions ?? [];
  let rootWasBlocked = false;

  for (const blockedInvocation of blockedInvocations) {
    const resumed = await invocationResumeRegistry.resumeInvocation({
      taskId,
      invocationId: blockedInvocation.invocationId,
      answeredQuestions,
    });

    if (!resumed) {
      rootWasBlocked = true;
    }
  }

  await taskQuestionsDomain.commands.clearBlockedInvocations({ taskId });

  if (rootWasBlocked) {
    const commentId = task.activeCommentId ?? answeredQuestions[0]?.commentId;

    if (commentId) {
      void taskService.executeTask({
        taskId,
        userId,
        commentId,
        mode: taskService.TaskExecutionMode.Resume,
      }).catch((error: unknown) => {
        logger('task.execute.unhandled', {
          meta: { sessionId: 'TASK_EXECUTION', taskId, userId },
          data: { error: error instanceof Error ? error.message : String(error) },
        });
      });
    }
  }

  const refreshedResult = await taskQuestionsDomain.queries.getTaskQuestions({ taskId });
  const refreshedTaskQuestions = refreshedResult.data ?? submittedTaskQuestions;

  return {
    taskQuestions: toTaskQuestionsResponse({ taskQuestions: refreshedTaskQuestions }),
  };
};
