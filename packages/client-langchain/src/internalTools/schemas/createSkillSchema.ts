import { z } from 'zod';

const SKILL_SCRIPT_LANGUAGE_VALUES = ['python', 'nodejs', 'bash', 'terminal'] as const;

export const createSkillSchema = z.object({
  specializationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  input: z.string().min(1),
  output: z.string().min(1),
  rule: z.string().min(1),
  scripts: z
    .array(
      z.object({
        filename: z.string().min(1),
        language: z.enum(SKILL_SCRIPT_LANGUAGE_VALUES),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
  usesSkillIds: z.array(z.string().min(1)).optional().default([]),
});
