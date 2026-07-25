import type { McpUsageEventModel } from '../../model';

export interface GetModelsByTaskIdParams {
  taskId: string;
}

export interface GetModelsByTaskIdResult {
  data: McpUsageEventModel[];
}
