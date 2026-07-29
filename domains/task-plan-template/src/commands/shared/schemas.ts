import { z } from 'zod';

export const TASK_PLAN_TEMPLATE_ITEM_SCHEMA = z.object({
  agentId: z.string().min(1),
  skillId: z.string().min(1).nullable(),
  description: z.string().min(1).max(500),
  order: z.number().int().nonnegative(),
});

export const TASK_PLAN_TEMPLATE_ITEMS_SCHEMA = z.array(TASK_PLAN_TEMPLATE_ITEM_SCHEMA).min(1);

export const MAX_JSON_BYTES = 32 * 1024;
