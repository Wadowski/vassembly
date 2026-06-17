import { updateDbById } from '@vassembly/commands';
import { INTENT_CATEGORY_SLUG } from '@vassembly/constants';
import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskMongodbDao } from '../../clients';
import { TaskModel, taskFactory } from '../../model';

import { UPDATE_TASK_INPUT_SCHEMA } from './types';

import type { UpdateTaskCommandInput, UpdateTaskCommandResult } from './types';

const VALID_CATEGORY_SLUGS = Object.values(INTENT_CATEGORY_SLUG) as [string, ...string[]];

const UPDATE_TASK_DB_SCHEMA = z.object({
  title: z.string().min(1).max(120).optional(),
  category: z.enum(VALID_CATEGORY_SLUGS).nullable().optional(),
});

const persistUpdateTask = updateDbById<TaskModel>({
  dao: taskMongodbDao,
  factory: taskFactory,
  validationSchema: UPDATE_TASK_DB_SCHEMA,
});

export const updateTask = async ({
  id,
  title,
  category,
}: UpdateTaskCommandInput): Promise<UpdateTaskCommandResult> => {
  const parsed = UPDATE_TASK_INPUT_SCHEMA.safeParse({ id, title, category });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const data: Partial<Pick<TaskModel, 'title' | 'category'>> = {};

  if (parsed.data.title !== undefined) {
    data.title = parsed.data.title;
  }

  if (parsed.data.category !== undefined) {
    data.category = parsed.data.category as INTENT_CATEGORY_SLUG | null;
  }

  return persistUpdateTask({ id: parsed.data.id, data });
};
