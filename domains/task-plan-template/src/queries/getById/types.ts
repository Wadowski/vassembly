import type { TaskPlanTemplateResponse } from '../../model';

export interface GetByIdParams {
  id: string;
}

export interface GetByIdResult {
  data: TaskPlanTemplateResponse;
}
