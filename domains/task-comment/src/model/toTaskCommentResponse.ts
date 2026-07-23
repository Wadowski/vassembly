import { assertRequiredFields, toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { TaskCommentResponse } from './dto';
import type { TaskCommentModel } from './model';

const REQUIRED_FIELDS = ['id', 'taskId', 'userId', 'userText', 'createdAt', 'updatedAt'] as const;

export interface ToTaskCommentResponseParams {
  taskComment: TaskCommentModel;
}

export const toTaskCommentResponse = ({
  taskComment,
}: ToTaskCommentResponseParams): TaskCommentResponse => {
  assertRequiredFields({
    entity: taskComment,
    fields: REQUIRED_FIELDS,
    entityName: 'Task comment',
  });

  return {
    id: taskComment.id!,
    taskId: taskComment.taskId!,
    userId: taskComment.userId!,
    userText: taskComment.userText!,
    agentResponse: taskComment.agentResponse ?? null,
    createdAt: toIsoString({ value: taskComment.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: taskComment.updatedAt!, fieldName: 'updatedAt' }),
  };
};
