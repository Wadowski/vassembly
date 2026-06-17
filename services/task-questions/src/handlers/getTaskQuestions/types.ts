import type { TaskQuestionsResponse } from '@vassembly/domain-task-questions';

export interface GetTaskQuestionsHandlerInput {
  userId: string;
  taskId: string;
}

export interface GetTaskQuestionsHandlerOutput {
  taskQuestions: TaskQuestionsResponse;
}
