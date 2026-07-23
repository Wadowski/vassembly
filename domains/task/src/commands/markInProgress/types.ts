export interface MarkInProgressCommandInput {
  taskId: string;
  activeCommentId?: string;
}

import type { TaskModel } from '../../model';

export interface MarkInProgressCommandResult {
  data: TaskModel | undefined;
}
