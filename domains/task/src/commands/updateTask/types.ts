import { INTENT_CATEGORY_SLUG } from '@vassembly/constants';
import { z } from 'zod';

import type { TaskModel } from '../../model';

const VALID_CATEGORY_SLUGS = Object.values(INTENT_CATEGORY_SLUG) as [string, ...string[]];

export const UPDATE_TASK_INPUT_SCHEMA = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(120).optional(),
    category: z.enum(VALID_CATEGORY_SLUGS).nullable().optional(),
  })
  .refine((data) => data.title !== undefined || data.category !== undefined, {
    message: 'At least one of title or category must be provided',
  });

export interface UpdateTaskCommandInput {
  id: string;
  title?: string;
  category?: INTENT_CATEGORY_SLUG | null;
}

export interface UpdateTaskCommandResult {
  data: TaskModel | undefined;
}
