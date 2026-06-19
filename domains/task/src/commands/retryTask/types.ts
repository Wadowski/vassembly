import type { TaskModel } from '../../model';

export interface RetryTaskCommandInput {
  taskId: string;
}

export interface RetryTaskCommandResult {
  data: TaskModel;
}
