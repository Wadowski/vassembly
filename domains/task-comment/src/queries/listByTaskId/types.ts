import type { TaskCommentModel } from '../../model';

export interface ListByTaskIdInput {
  taskId: string;
}

export interface ListByTaskIdResult {
  data: TaskCommentModel[];
}
