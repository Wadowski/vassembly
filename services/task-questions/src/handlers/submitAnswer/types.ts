import type { TaskQuestionsResponse } from '@vassembly/domain-task-questions';

export interface SubmitAnswerHandlerInput {
  userId: string;
  taskId: string;
  questionId: string;
  answer: string | string[] | boolean;
}

export interface SubmitAnswerHandlerOutput {
  taskQuestions: TaskQuestionsResponse;
}
