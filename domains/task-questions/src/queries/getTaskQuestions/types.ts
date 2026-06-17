import type { TaskQuestionsModel } from '../../model';

export interface GetTaskQuestionsQueryInput {
  taskId: string;
}

export interface GetTaskQuestionsQueryResult {
  data: TaskQuestionsModel | null;
}
