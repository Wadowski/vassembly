import type { TaskProgressModel } from '../../model';

export interface ListByTaskIdInput {
  taskId: string;
}

export interface ListByTaskIdResult {
  data: TaskProgressModel[];
}
