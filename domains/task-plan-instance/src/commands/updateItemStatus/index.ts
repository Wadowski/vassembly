import { updateDbById } from '@vassembly/commands';
import { NotFoundError, ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskPlanInstanceMongodbDao } from '../../clients';
import { TaskPlanInstanceModel, TaskPlanInstanceStatus, taskPlanInstanceFactory } from '../../model';
import { getModelById } from '../../queries/getModelById';
import { deriveInstanceStatus } from '../shared/deriveInstanceStatus';

import type { UpdateItemStatusCommandInput, UpdateItemStatusCommandResult } from './types';

const UPDATE_INPUT_SCHEMA = z.object({
  id: z.string().min(1),
  templateItemIndex: z.number().int().nonnegative(),
  status: z.nativeEnum(TaskPlanInstanceStatus),
  output: z.record(z.string(), z.unknown()).optional(),
  errorMessage: z.string().optional(),
});

const persistUpdate = updateDbById<TaskPlanInstanceModel>({
  dao: taskPlanInstanceMongodbDao,
  factory: taskPlanInstanceFactory,
});

const resolveInstanceTimestamps = ({
  status,
  now,
}: {
  status: TaskPlanInstanceStatus;
  now: Date;
}): {
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
} => {
  const timestampByStatus: Partial<
    Record<TaskPlanInstanceStatus, { startedAt?: Date; completedAt?: Date; failedAt?: Date }>
  > = {
    [TaskPlanInstanceStatus.InProgress]: { startedAt: now },
    [TaskPlanInstanceStatus.Done]: { completedAt: now },
    [TaskPlanInstanceStatus.Failed]: { failedAt: now },
  };

  const timestamps = timestampByStatus[status] ?? {};

  return {
    startedAt: timestamps.startedAt ?? null,
    completedAt: timestamps.completedAt ?? null,
    failedAt: timestamps.failedAt ?? null,
  };
};

export const updateItemStatus = async (
  input: UpdateItemStatusCommandInput,
): Promise<UpdateItemStatusCommandResult> => {
  const parsed = UPDATE_INPUT_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const instanceResult = await getModelById({ id: parsed.data.id });
  const instance = instanceResult.data;
  const items = instance.items ?? [];
  const now = new Date();

  if (parsed.data.templateItemIndex >= items.length) {
    throw new NotFoundError('Instance item not found');
  }

  const updatedItems = items.map((item) => {
    if (item.templateItemIndex !== parsed.data.templateItemIndex) {
      return item;
    }

    const nextItem = {
      ...item,
      status: parsed.data.status,
    };

    if (parsed.data.status === TaskPlanInstanceStatus.InProgress) {
      nextItem.startedAt = item.startedAt ?? now;
    }

    if (parsed.data.status === TaskPlanInstanceStatus.Done) {
      nextItem.completedAt = now;
      nextItem.output = parsed.data.output ?? item.output;
      nextItem.errorMessage = null;
      nextItem.failedAt = null;
    }

    if (parsed.data.status === TaskPlanInstanceStatus.Failed) {
      nextItem.failedAt = now;
      nextItem.errorMessage = parsed.data.errorMessage ?? 'Item execution failed';
      nextItem.completedAt = null;
    }

    return nextItem;
  });

  const status = deriveInstanceStatus({ items: updatedItems });
  const instanceTimestamps = resolveInstanceTimestamps({ status, now });

  return persistUpdate({
    id: parsed.data.id,
    data: {
      items: updatedItems,
      status,
      startedAt:
        instance.startedAt ?? (status !== TaskPlanInstanceStatus.Pending ? now : instance.startedAt ?? null),
      completedAt: instanceTimestamps.completedAt ?? instance.completedAt ?? null,
      failedAt: instanceTimestamps.failedAt ?? instance.failedAt ?? null,
    },
  });
};
