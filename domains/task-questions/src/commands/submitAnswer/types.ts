import type { TaskQuestionsModel } from '../../model';

export interface SubmitAnswerCommandInput {
  taskId: string;
  questionId: string;
  answer: string | string[] | boolean;
}

export interface SubmitAnswerCommandResult {
  data: TaskQuestionsModel;
}
