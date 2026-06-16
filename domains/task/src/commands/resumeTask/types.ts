import type { TaskModel } from '../../model';

export interface ResumeTaskCommandInput {
  taskId: string;
}

export interface ResumeTaskCommandResult {
  data: TaskModel;
}
