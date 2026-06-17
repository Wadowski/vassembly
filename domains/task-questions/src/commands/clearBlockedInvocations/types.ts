import type { TaskQuestionsModel } from '../../model';

export interface ClearBlockedInvocationsCommandInput {
  taskId: string;
}

export interface ClearBlockedInvocationsCommandResult {
  data: TaskQuestionsModel | null;
}
