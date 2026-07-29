import { updateDbById } from '@vassembly/commands';
import { NotFoundError, ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskPlanInstanceMongodbDao } from '../../clients';
import { TaskPlanInstanceModel, taskPlanInstanceFactory } from '../../model';
import { getModelById } from '../../queries/getModelById';

import type { BackfillItemSkillIdCommandInput, BackfillItemSkillIdCommandResult } from './types';

const BACKFILL_INPUT_SCHEMA = z.object({
  id: z.string().min(1),
  templateItemIndex: z.number().int().nonnegative(),
  skillId: z.string().min(1),
});

const persistUpdate = updateDbById<TaskPlanInstanceModel>({
  dao: taskPlanInstanceMongodbDao,
  factory: taskPlanInstanceFactory,
});

export const backfillItemSkillId = async (
  input: BackfillItemSkillIdCommandInput,
): Promise<BackfillItemSkillIdCommandResult> => {
  const parsed = BACKFILL_INPUT_SCHEMA.safeParse(input);

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
      skillId: parsed.data.skillId,
    };
  });

  return persistUpdate({
    id: parsed.data.id,
    data: {
      items: updatedItems,
    },
  });
};
