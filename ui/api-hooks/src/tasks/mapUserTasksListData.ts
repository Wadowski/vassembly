import { toTaskDto } from './mapTaskData';
import type { GraphQLUserTasksListData, UserTasksListResponse } from './types';

export const mapUserTasksListData = (
  data: GraphQLUserTasksListData | undefined,
): UserTasksListResponse | undefined => {
  const list = data?.userTasks;

  if (!list) {
    return undefined;
  }

  return {
    items: (list.items ?? []).map(toTaskDto),
    totalCount: list.totalCount ?? 0,
    page: list.page ?? 0,
    size: list.size ?? 0,
  };
};
