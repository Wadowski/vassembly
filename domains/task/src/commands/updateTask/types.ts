import { INTENT_CATEGORY_SLUG, normalizeIntentCategorySlug } from '@vassembly/constants';
import { z } from 'zod';

import type { TaskModel } from '../../model';

const VALID_CATEGORY_SLUGS = Object.values(INTENT_CATEGORY_SLUG) as [string, ...string[]];

const MONGODB_OBJECT_ID_HEX = /^[a-f\d]{24}$/i;

const categorySchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null) {
      return value;
    }

    if (typeof value !== 'string') {
      return value;
    }

    return normalizeIntentCategorySlug(value) ?? value;
  },
  z.enum(VALID_CATEGORY_SLUGS).nullable().optional(),
);

export const UPDATE_TASK_INPUT_SCHEMA = z
  .object({
    id: z.string().regex(MONGODB_OBJECT_ID_HEX, {
      message: 'id must be a 24 character hexadecimal MongoDB ObjectId string',
    }),
    title: z.string().min(1).max(120).optional(),
    category: categorySchema,
    specializationIds: z.array(z.string().min(1)).max(3).nullable().optional(),
    skillIdsUsed: z.array(z.string().min(1)).nullable().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.category !== undefined ||
      data.specializationIds !== undefined ||
      data.skillIdsUsed !== undefined,
    {
      message: 'At least one of title, category, specializationIds, or skillIdsUsed must be provided',
    },
  );

export interface UpdateTaskCommandInput {
  id: string;
  title?: string;
  category?: INTENT_CATEGORY_SLUG | null;
  specializationIds?: string[] | null;
  skillIdsUsed?: string[] | null;
}

export interface UpdateTaskCommandResult {
  data: TaskModel | undefined;
}
