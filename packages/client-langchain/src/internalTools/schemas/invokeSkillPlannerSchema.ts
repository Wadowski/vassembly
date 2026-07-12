import { z } from 'zod';

export const invokeSkillPlannerSchema = z.object({
  specializationId: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Optional. Specialization MongoDB id or name. Specialization workers should omit this — the tool resolves your linked specialization automatically. Task-level callers should pass the id or name from ## Linked specializations.',
    ),
  goal: z.string().min(1).describe('What the new skill must enable for this task'),
});
