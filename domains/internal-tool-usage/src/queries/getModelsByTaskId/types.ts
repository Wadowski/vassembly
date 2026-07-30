import type { InternalToolUsageEventModel } from '../../model';

export interface GetModelsByTaskIdParams {
  taskId: string;
}

export interface GetModelsByTaskIdResult {
  data: InternalToolUsageEventModel[];
}
