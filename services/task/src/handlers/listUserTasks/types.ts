import type { TaskModel } from '@vassembly/domain-task';

export interface ListUserTasksHandlerInput {
  userId: string;
  page: number;
  size: number;
  search?: string;
}

export interface ListUserTasksHandlerOutput {
  items: TaskModel[];
  totalCount: number;
  page: number;
  size: number;
}
