import { z } from 'zod';

const SKILL_SCRIPT_LANGUAGE_VALUES = ['python', 'nodejs', 'bash', 'terminal'] as const;

const RUN_SKILL_SCRIPT_REFERENCE_PATTERN = /run_skill_script\s+scripts\/[^\s]+/i;

const normalizeScriptLanguage = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'javascript' || normalized === 'js') {
    return 'nodejs';
  }

  if (normalized === 'python3' || normalized === 'py') {
    return 'python';
  }

  if (normalized === 'sh' || normalized === 'shell') {
    return 'bash';
  }

  return normalized;
};

const coerceScriptsField = (value: unknown): unknown => {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(trimmed);

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return value;
};

const skillScriptSchema = z.object({
  filename: z.string().min(1),
  language: z.preprocess(
    normalizeScriptLanguage,
    z.enum(SKILL_SCRIPT_LANGUAGE_VALUES),
  ),
  content: z.string(),
});

export const createSkillSchema = z
  .object({
    specializationId: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    input: z.string().min(1),
    output: z.string().min(1),
    rule: z.string().min(1),
    scripts: z
      .preprocess(coerceScriptsField, z.array(skillScriptSchema).optional().default([])),
    usesSkillIds: z.array(z.string().min(1)).optional().default([]),
  })
  .superRefine((value, context) => {
    if (
      value.scripts.length === 0 &&
      RUN_SKILL_SCRIPT_REFERENCE_PATTERN.test(value.rule)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Skill rule references run_skill_script but scripts is empty. Include script files in scripts[].',
        path: ['scripts'],
      });
    }
  });
