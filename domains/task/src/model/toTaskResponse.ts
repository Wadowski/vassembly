import { assertRequiredFields, toIsoString } from '@vassembly/mappers';

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
    createdAt: toIsoString({ value: task.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: task.updatedAt!, fieldName: 'updatedAt' }),
  };
};
