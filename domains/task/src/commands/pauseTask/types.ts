import type { TaskModel } from '../../model';

export interface PauseTaskCommandInput {
  taskId: string;
}

export interface PauseTaskCommandResult {
  data: TaskModel;
}
