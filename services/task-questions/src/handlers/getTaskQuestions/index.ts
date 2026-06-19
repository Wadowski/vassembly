import taskDomain from '@vassembly/domain-task';
import taskQuestionsDomain, { toTaskQuestionsResponse } from '@vassembly/domain-task-questions';
import { NotFoundError } from '@vassembly/errors';

import type { GetTaskQuestionsHandlerInput, GetTaskQuestionsHandlerOutput } from './types';

const EMPTY_TASK_QUESTIONS = ({
  taskId,
}: {
  taskId: string;
}): GetTaskQuestionsHandlerOutput['taskQuestions'] => ({
  taskId,
  pendingQuestions: [],
  answeredQuestions: [],
});

export const getTaskQuestions = async ({
  userId,
  taskId,
}: GetTaskQuestionsHandlerInput): Promise<GetTaskQuestionsHandlerOutput> => {
  const taskResult = await taskDomain.queries.getModelById({ id: taskId });
  const task = taskResult.data;

  if (!task || task.userId !== userId) {
    throw new NotFoundError('Task not found');
  }

  const questionsResult = await taskQuestionsDomain.queries.getTaskQuestions({ taskId });
  const taskQuestions = questionsResult.data;

  if (!taskQuestions) {
    return { taskQuestions: EMPTY_TASK_QUESTIONS({ taskId }) };
  }

  return {
    taskQuestions: toTaskQuestionsResponse({ taskQuestions }),
  };
};
