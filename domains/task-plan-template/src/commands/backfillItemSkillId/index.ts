import { updateDbById } from '@vassembly/commands';
import { NotFoundError, ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskPlanTemplateMongodbDao } from '../../clients';
import { TaskPlanTemplateModel, taskPlanTemplateFactory } from '../../model';
import { getModelById } from '../../queries/getModelById';

import type { BackfillItemSkillIdCommandInput, BackfillItemSkillIdCommandResult } from './types';

const BACKFILL_INPUT_SCHEMA = z.object({
  id: z.string().min(1),
  templateItemIndex: z.number().int().nonnegative(),
  skillId: z.string().min(1),
});

const persistUpdate = updateDbById<TaskPlanTemplateModel>({
  dao: taskPlanTemplateMongodbDao,
  factory: taskPlanTemplateFactory,
});

export const backfillItemSkillId = async (
  input: BackfillItemSkillIdCommandInput,
): Promise<BackfillItemSkillIdCommandResult> => {
  const parsed = BACKFILL_INPUT_SCHEMA.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const templateResult = await getModelById({ id: parsed.data.id });
  const template = templateResult.data;
  const items = template.items ?? [];

  if (parsed.data.templateItemIndex >= items.length) {
    throw new NotFoundError('Template item not found');
  }

  const updatedItems = items.map((item, index) => {
    if (index !== parsed.data.templateItemIndex) {
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
