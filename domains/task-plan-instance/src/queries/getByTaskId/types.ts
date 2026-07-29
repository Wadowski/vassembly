import type { TaskPlanInstanceResponse } from '../../model';

export interface GetByTaskIdParams {
  taskId: string;
}

export interface GetByTaskIdResult {
  data: TaskPlanInstanceResponse[];
}
