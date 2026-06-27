import { z } from 'zod';

export const resolveSkillSchema = z.object({
  skillName: z
    .string()
    .min(1)
    .describe('Exact name of the skill to resolve (e.g. "contract-review")'),
  specializationId: z
    .string()
    .optional()
    .describe(
      "Override specializationId. If omitted, the calling agent's specializationId is used.",
    ),
});
