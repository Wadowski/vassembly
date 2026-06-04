export interface FailTaskCommandInput {
  taskId: string;
  errorMessage: string;
  errorCode: string;
}

import type { TaskModel } from '../../model';

export interface FailTaskCommandResult {
  data: TaskModel | undefined;
}
