import { ValidationError } from '@vassembly/errors';

import { TaskStatus, TaskType } from './types';
import type { GraphQLGetTaskData, GraphQLTaskRow, TaskDto } from './types';

const TASK_STATUSES = Object.values(TaskStatus) as string[];

const toTaskStatus = (value: string | null | undefined): TaskDto['status'] => {
  if (value && TASK_STATUSES.includes(value)) {
    return value as TaskDto['status'];
  }
  throw new ValidationError('status is invalid');
};

const toTaskType = (value: string | null | undefined): TaskDto['type'] =>
  value === 'agent' ? TaskType.Agent : TaskType.User;

export const toTaskDto = (row: GraphQLTaskRow): TaskDto => ({
  id: row.id ?? '',
  userId: row.userId ?? '',
  description: row.description ?? '',
  type: toTaskType(row.type),
  status: toTaskStatus(row.status),
  agentAssignedId: row.agentAssignedId ?? null,
  title: row.title ?? null,
  activeCommentId: row.activeCommentId ?? null,
  errorMessage: row.errorMessage ?? null,
  errorCode: row.errorCode ?? null,
  startedAt: row.startedAt ?? null,
  completedAt: row.completedAt ?? null,
  failedAt: row.failedAt ?? null,
  pausedAt: row.pausedAt ?? null,
  createdAt: row.createdAt ?? '',
  updatedAt: row.updatedAt ?? '',
  specializationIds: row.specializationIds ?? null,
  skillIdsUsed: row.skillIdsUsed ?? null,
});

export const mapTaskDetailData = (
  data: GraphQLGetTaskData | undefined,
): TaskDto | undefined => {
  const task = data?.task;

  if (!task) {
    return undefined;
  }

  return toTaskDto(task);
};
