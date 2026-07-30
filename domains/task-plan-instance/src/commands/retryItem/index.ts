import { updateDbById } from '@vassembly/commands';
import { NotFoundError, ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskPlanInstanceMongodbDao } from '../../clients';
import { TaskPlanInstanceModel, TaskPlanInstanceStatus, taskPlanInstanceFactory } from '../../model';
import { getModelById } from '../../queries/getModelById';

import type { RetryItemCommandInput, RetryItemCommandResult } from './types';

const RETRY_INPUT_SCHEMA = z.object({
  id: z.string().min(1),
  templateItemIndex: z.number().int().nonnegative(),
});

const persistUpdate = updateDbById<TaskPlanInstanceModel>({
  dao: taskPlanInstanceMongodbDao,
  factory: taskPlanInstanceFactory,
});

export const retryItem = async (input: RetryItemCommandInput): Promise<RetryItemCommandResult> => {
  const parsed = RETRY_INPUT_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const instanceResult = await getModelById({ id: parsed.data.id });
  const instance = instanceResult.data;
  const items = instance.items ?? [];

  if (parsed.data.templateItemIndex >= items.length) {
    throw new NotFoundError('Instance item not found');
  }

  const updatedItems = items.map((item) => {
    if (item.templateItemIndex !== parsed.data.templateItemIndex) {
      return item;
    }

    return {
      ...item,
      status: TaskPlanInstanceStatus.Pending,
      completedAt: null,
      failedAt: null,
      errorMessage: null,
      retryCount: item.retryCount + 1,
    };
  });

  return persistUpdate({
    id: parsed.data.id,
    data: {
      items: updatedItems,
      status: TaskPlanInstanceStatus.InProgress,
      completedAt: null,
      failedAt: null,
    },
  });
};
