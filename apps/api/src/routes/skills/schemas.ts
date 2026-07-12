import {
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  SKILL_RULE_MAX_LENGTH,
  SKILL_SCRIPT_MAX_COUNT,
  SKILL_SCRIPT_MAX_SIZE_BYTES,
} from '@vassembly/domain-skill';
import { z } from 'zod';

const SKILL_SCRIPT_LANGUAGE_VALUES = ['python', 'nodejs', 'bash'] as [
  'python',
  'nodejs',
  'bash',
];

export const SKILL_SCRIPT_WRITE_BODY_SCHEMA = z.object({
  filename: z.string().trim().min(1).max(255),
  language: z.enum(SKILL_SCRIPT_LANGUAGE_VALUES),
  content: z.string().max(SKILL_SCRIPT_MAX_SIZE_BYTES),
});

export const CREATE_SKILL_BODY_SCHEMA = z.object({
  specializationId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(SKILL_NAME_MAX_LENGTH),
  description: z.string().trim().min(1).max(SKILL_DESCRIPTION_MAX_LENGTH),
  rule: z.string().trim().min(1).max(SKILL_RULE_MAX_LENGTH),
  scripts: z.array(SKILL_SCRIPT_WRITE_BODY_SCHEMA).max(SKILL_SCRIPT_MAX_COUNT).optional().default([]),
  usesSkillIds: z.array(z.string().trim().min(1)).optional().default([]),
});

export const UPDATE_SKILL_BODY_SCHEMA = z
  .object({
    description: z.string().trim().min(1).max(SKILL_DESCRIPTION_MAX_LENGTH).optional(),
    rule: z.string().trim().min(1).max(SKILL_RULE_MAX_LENGTH).optional(),
    enabled: z.boolean().optional(),
    scripts: z.array(SKILL_SCRIPT_WRITE_BODY_SCHEMA).max(SKILL_SCRIPT_MAX_COUNT).optional(),
    usesSkillIds: z.array(z.string().trim().min(1)).optional(),
  })
  .refine(
    (value) =>
      value.description !== undefined ||
      value.rule !== undefined ||
      value.enabled !== undefined ||
      value.scripts !== undefined ||
      value.usesSkillIds !== undefined,
    { message: 'At least one field must be provided' },
  );

export const SKILL_RESPONSE_SCHEMA = z.object({
  id: z.string(),
  specializationId: z.string(),
  name: z.string(),
  description: z.string(),
  rule: z.string(),
  enabled: z.boolean(),
  scripts: z.array(
    z.object({
      filename: z.string(),
      language: z.enum(SKILL_SCRIPT_LANGUAGE_VALUES),
    }),
  ),
  usesSkillIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  removedAt: z.string().nullable(),
});
