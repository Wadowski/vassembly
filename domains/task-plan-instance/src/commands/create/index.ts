import { createDb } from '@vassembly/commands';
import { ConflictError, ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskPlanInstanceMongodbDao } from '../../clients';
import { TaskPlanInstanceModel, TaskPlanInstanceStatus, taskPlanInstanceFactory } from '../../model';

import type { CreateTaskPlanInstanceCommandInput, CreateTaskPlanInstanceCommandResult } from './types';

const CREATE_INPUT_SCHEMA = z.object({
  taskPlanTemplateId: z.string().min(1),
  taskId: z.string().min(1),
  commentId: z.string().min(1),
  inputDetails: z.record(z.string(), z.unknown()),
  templateItems: z
    .array(
      z.object({
        agentId: z.string().min(1),
        skillId: z.string().min(1).nullable(),
        description: z.string().min(1),
        order: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

const CREATE_DB_SCHEMA = z.object({
  taskPlanTemplateId: z.string().min(1),
  taskId: z.string().min(1),
  commentId: z.string().min(1),
  inputDetails: z.record(z.string(), z.unknown()),
  status: z.nativeEnum(TaskPlanInstanceStatus),
  items: z.array(z.unknown()).min(1),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  failedAt: z.date().nullable(),
});

const isDuplicateKeyError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return (error as { code?: number }).code === 11000;
};

const persistCreate = createDb<TaskPlanInstanceModel>({
  dao: taskPlanInstanceMongodbDao,
  factory: taskPlanInstanceFactory,
  validationSchema: CREATE_DB_SCHEMA,
});

export const create = async (
  input: CreateTaskPlanInstanceCommandInput,
): Promise<CreateTaskPlanInstanceCommandResult> => {
  const parsed = CREATE_INPUT_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const items = parsed.data.templateItems.map((item, index) => ({
    templateItemIndex: index,
    agentId: item.agentId,
    skillId: item.skillId,
    order: item.order,
    status: TaskPlanInstanceStatus.Pending,
    startedAt: null,
    completedAt: null,
    failedAt: null,
    output: null,
    errorMessage: null,
    retryCount: 0,
  }));

  try {
    return await persistCreate({
      taskPlanTemplateId: parsed.data.taskPlanTemplateId,
      taskId: parsed.data.taskId,
      commentId: parsed.data.commentId,
      inputDetails: parsed.data.inputDetails,
      status: TaskPlanInstanceStatus.Pending,
      items,
      startedAt: null,
      completedAt: null,
      failedAt: null,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ConflictError('Task plan instance already exists for comment', error);
    }

    throw error;
  }
};
