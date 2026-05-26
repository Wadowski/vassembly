import { TaskStatus, TaskType } from './types';
import type { GraphQLTaskRow, GraphQLUserTasksListData, TaskDto, UserTasksListResponse } from './types';

const TASK_STATUSES = Object.values(TaskStatus) as string[];

const toTaskStatus = (value: string | null | undefined): TaskDto['status'] => {
  if (value && TASK_STATUSES.includes(value)) {
    return value as TaskDto['status'];
  }
  return TaskStatus.Created;
};

const toTaskType = (value: string | null | undefined): TaskDto['type'] =>
  value === 'agent' ? TaskType.Agent : TaskType.User;

const toTaskDto = (row: GraphQLTaskRow): TaskDto => ({
  id: row.id ?? '',
  userId: row.userId ?? '',
  description: row.description ?? '',
  type: toTaskType(row.type),
  status: toTaskStatus(row.status),
  agentAssignedId: row.agentAssignedId ?? null,
  title: row.title ?? null,
  createdAt: row.createdAt ?? '',
  updatedAt: row.updatedAt ?? '',
});

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
