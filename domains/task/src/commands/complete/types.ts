export interface CompleteTaskCommandInput {
  taskId: string;
  llmResponse: string;
}

import type { TaskModel } from '../../model';

export interface CompleteTaskCommandResult {
  data: TaskModel | undefined;
}
