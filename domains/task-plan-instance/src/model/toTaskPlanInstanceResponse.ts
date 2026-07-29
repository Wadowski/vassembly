import { assertRequiredFields, toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { TaskPlanInstanceResponse } from './dto';
import type { TaskPlanInstanceModel } from './model';

const REQUIRED_FIELDS = [
  'id',
  'taskPlanTemplateId',
  'taskId',
  'commentId',
  'status',
  'createdAt',
  'updatedAt',
] as const;

export interface ToTaskPlanInstanceResponseParams {
  taskPlanInstance: TaskPlanInstanceModel;
}

export const toTaskPlanInstanceResponse = ({
  taskPlanInstance,
}: ToTaskPlanInstanceResponseParams): TaskPlanInstanceResponse => {
  assertRequiredFields({
    entity: taskPlanInstance,
    fields: REQUIRED_FIELDS,
    entityName: 'Task plan instance',
  });

  return {
    id: taskPlanInstance.id!,
    taskPlanTemplateId: taskPlanInstance.taskPlanTemplateId!,
    taskId: taskPlanInstance.taskId!,
    commentId: taskPlanInstance.commentId!,
    inputDetails: taskPlanInstance.inputDetails ?? {},
    status: taskPlanInstance.status!,
    items: (taskPlanInstance.items ?? []).map((item) => ({
      templateItemIndex: item.templateItemIndex,
      agentId: item.agentId,
      skillId: item.skillId,
      order: item.order,
      status: item.status,
      startedAt: toNullableIsoString(item.startedAt),
      completedAt: toNullableIsoString(item.completedAt),
      failedAt: toNullableIsoString(item.failedAt),
      output: item.output,
      errorMessage: item.errorMessage,
      retryCount: item.retryCount,
    })),
    startedAt: toNullableIsoString(taskPlanInstance.startedAt),
    completedAt: toNullableIsoString(taskPlanInstance.completedAt),
    failedAt: toNullableIsoString(taskPlanInstance.failedAt),
    createdAt: toIsoString({ value: taskPlanInstance.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: taskPlanInstance.updatedAt!, fieldName: 'updatedAt' }),
    removedAt: toNullableIsoString(taskPlanInstance.removedAt),
  };
};
