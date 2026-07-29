import { z } from 'zod';

import {
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_INPUT_MAX_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  SKILL_OUTPUT_MAX_LENGTH,
  SKILL_RULE_MAX_LENGTH,
  SKILL_SCRIPT_LANGUAGES,
  SKILL_SCRIPT_MAX_COUNT,
  SKILL_SCRIPT_MAX_SIZE_BYTES,
} from '../../constants';

export const SKILL_SCRIPT_INPUT_SCHEMA = z.object({
  filename: z.string().trim().min(1).max(255),
  language: z.enum(SKILL_SCRIPT_LANGUAGES),
  content: z.string().max(SKILL_SCRIPT_MAX_SIZE_BYTES),
});

export const SKILL_SCRIPTS_INPUT_SCHEMA = z
  .array(SKILL_SCRIPT_INPUT_SCHEMA)
  .max(SKILL_SCRIPT_MAX_COUNT)
  .default([]);

export const SKILL_NAME_SCHEMA = z.string().trim().min(1).max(SKILL_NAME_MAX_LENGTH);

export const SKILL_DESCRIPTION_SCHEMA = z
  .string()
  .trim()
  .min(1)
  .max(SKILL_DESCRIPTION_MAX_LENGTH);

export const SKILL_INPUT_SCHEMA = z.string().trim().min(1).max(SKILL_INPUT_MAX_LENGTH);

export const SKILL_OUTPUT_SCHEMA = z.string().trim().min(1).max(SKILL_OUTPUT_MAX_LENGTH);

export const SKILL_RULE_SCHEMA = z.string().trim().min(1).max(SKILL_RULE_MAX_LENGTH);

export const USES_SKILL_IDS_SCHEMA = z.array(z.string().trim().min(1)).default([]);
