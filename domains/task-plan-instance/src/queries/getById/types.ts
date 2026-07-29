import type { TaskPlanInstanceResponse } from '../../model';

export interface GetByIdParams {
  id: string;
}

export interface GetByIdResult {
  data: TaskPlanInstanceResponse;
}
