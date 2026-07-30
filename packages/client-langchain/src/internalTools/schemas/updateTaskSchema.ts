import { normalizeIntentCategorySlug } from '@vassembly/constants';
import { z } from 'zod';

const optionalCategorySchema = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return normalizeIntentCategorySlug(value) ?? undefined;
  });

export const updateTaskSchema = z.object({
  taskId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  category: optionalCategorySchema,
  specializationIds: z.array(z.string().min(1)).optional(),
});
