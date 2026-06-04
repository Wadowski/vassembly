import type { TaskModel } from '../../model';

export interface ListUserTasksQueryInput {
  userId: string;
  page: number;
  size: number;
  search?: string;
}

export interface ListUserTasksQueryResult {
  items: TaskModel[];
  totalCount: number;
  page: number;
  size: number;
}
