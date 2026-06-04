import { assertRequiredFields, toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { TaskResponse } from './dto';
import type { TaskModel } from './model';

const REQUIRED_FIELDS = ['id', 'userId', 'description', 'type', 'status', 'createdAt', 'updatedAt'] as const;

export interface ToTaskResponseParams {
  task: TaskModel;
}

export const toTaskResponse = ({ task }: ToTaskResponseParams): TaskResponse => {
  assertRequiredFields({
    entity: task,
    fields: REQUIRED_FIELDS,
    entityName: 'Task',
  });

  return {
    id: task.id!,
    userId: task.userId!,
    description: task.description!,
    type: task.type!,
    status: task.status!,
    agentAssignedId: task.agentAssignedId ?? null,
    title: task.title ?? null,
    llmResponse: task.llmResponse ?? null,
    errorMessage: task.errorMessage ?? null,
    errorCode: task.errorCode ?? null,
    startedAt: toNullableIsoString(task.startedAt),
    completedAt: toNullableIsoString(task.completedAt),
    failedAt: toNullableIsoString(task.failedAt),
    createdAt: toIsoString({ value: task.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: task.updatedAt!, fieldName: 'updatedAt' }),
  };
};
