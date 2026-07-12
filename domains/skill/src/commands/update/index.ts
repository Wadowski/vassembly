import { updateDbById } from '@vassembly/commands';
import { NotFoundError, ValidationError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { scriptStorageClient, skillMongodbDao } from '../../clients';
import { skillFactory, SkillModel } from '../../model';
import { getModelById } from '../../queries/getModelById';
import { persistSkillScripts, removeSkillScripts } from '../shared/persistScripts';
import {
  SKILL_DESCRIPTION_SCHEMA,
  SKILL_RULE_SCHEMA,
  SKILL_SCRIPTS_INPUT_SCHEMA,
  USES_SKILL_IDS_SCHEMA,
} from '../shared/schemas';

import type { UpdateSkillCommandInput, UpdateSkillCommandResult } from './types';

const UPDATE_INPUT_SCHEMA = z
  .object({
    id: z.string().trim().min(1),
    description: SKILL_DESCRIPTION_SCHEMA.optional(),
    rule: SKILL_RULE_SCHEMA.optional(),
    enabled: z.boolean().optional(),
    scripts: SKILL_SCRIPTS_INPUT_SCHEMA.optional(),
    usesSkillIds: USES_SKILL_IDS_SCHEMA.optional(),
  })
  .refine(
    (value) =>
      value.description !== undefined ||
      value.rule !== undefined ||
      value.enabled !== undefined ||
      value.scripts !== undefined ||
      value.usesSkillIds !== undefined,
    { message: 'At least one field must be provided for update' },
  );

const UPDATE_DB_SCHEMA = z.object({
  description: SKILL_DESCRIPTION_SCHEMA.optional(),
  rule: SKILL_RULE_SCHEMA.optional(),
  enabled: z.boolean().optional(),
  scripts: z
    .array(
      z.object({
        filename: z.string().min(1),
        language: z.enum(['python', 'nodejs', 'bash', 'terminal']),
        storageKey: z.string().min(1),
      }),
    )
    .optional(),
  usesSkillIds: USES_SKILL_IDS_SCHEMA.optional(),
});

const validateUpdateInput = validatorFactory(UPDATE_INPUT_SCHEMA);

const persistUpdate = updateDbById<SkillModel>({
  dao: skillMongodbDao,
  factory: skillFactory,
  validationSchema: UPDATE_DB_SCHEMA,
});

export const update = async (
  input: UpdateSkillCommandInput,
): Promise<UpdateSkillCommandResult> => {
  const parsed = validateUpdateInput(input);

  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.error);
  }

  const existingResult = await getModelById({ id: parsed.data.id });
  const existing = existingResult.data;

  if (!existing?.id) {
    throw new NotFoundError('Skill not found');
  }

  const updateData: Partial<SkillModel> = {};

  if (parsed.data.description !== undefined) {
    updateData.description = parsed.data.description.trim();
  }

  if (parsed.data.rule !== undefined) {
    updateData.rule = parsed.data.rule.trim();
  }

  if (parsed.data.enabled !== undefined) {
    updateData.enabled = parsed.data.enabled;
  }

  if (parsed.data.scripts !== undefined) {
    const scriptsToRemove = (existing.scripts ?? []).filter(
      (existingScript) =>
        !parsed.data.scripts!.some((script) => script.filename === existingScript.filename),
    );

    if (scriptsToRemove.length > 0) {
      await removeSkillScripts({
        scripts: scriptsToRemove,
        scriptStorageClient,
      });
    }

    const persistedScripts = await persistSkillScripts({
      skillId: existing.id,
      scripts: parsed.data.scripts,
      scriptStorageClient,
    });

    updateData.scripts = persistedScripts;
  }

  if (parsed.data.usesSkillIds !== undefined) {
    updateData.usesSkillIds = parsed.data.usesSkillIds;
  }

  const result = await persistUpdate({
    id: parsed.data.id,
    data: updateData,
  });

  return result;
};
