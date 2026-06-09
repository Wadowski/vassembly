import type { McpListItemResponse } from '../../model';

export interface GetByIdParams {
  id: string;
}

export interface GetByIdResult {
  data: McpListItemResponse;
}
