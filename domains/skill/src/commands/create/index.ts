import { createDb } from '@vassembly/commands';
import { ConflictError, ValidationError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { scriptStorageClient, skillMongodbDao } from '../../clients';
import { skillFactory, SkillModel } from '../../model';
import { getModelById } from '../../queries/getModelById';
import { persistSkillScripts } from '../shared/persistScripts';
import {
  SKILL_DESCRIPTION_SCHEMA,
  SKILL_INPUT_SCHEMA,
  SKILL_NAME_SCHEMA,
  SKILL_OUTPUT_SCHEMA,
  SKILL_RULE_SCHEMA,
  SKILL_SCRIPTS_INPUT_SCHEMA,
  USES_SKILL_IDS_SCHEMA,
} from '../shared/schemas';

import type { CreateSkillCommandInput, CreateSkillCommandResult } from './types';

const CREATE_INPUT_SCHEMA = z.object({
  specializationId: z.string().trim().min(1).max(100),
  name: SKILL_NAME_SCHEMA,
  description: SKILL_DESCRIPTION_SCHEMA,
  input: SKILL_INPUT_SCHEMA,
  output: SKILL_OUTPUT_SCHEMA,
  rule: SKILL_RULE_SCHEMA,
  scripts: SKILL_SCRIPTS_INPUT_SCHEMA,
  usesSkillIds: USES_SKILL_IDS_SCHEMA.optional(),
  onDuplicate: z.enum(['error', 'returnExisting']).optional(),
});

const CREATE_DB_SCHEMA = z.object({
  specializationId: z.string().min(1).max(100),
  name: SKILL_NAME_SCHEMA,
  description: SKILL_DESCRIPTION_SCHEMA,
  input: SKILL_INPUT_SCHEMA,
  output: SKILL_OUTPUT_SCHEMA,
  rule: SKILL_RULE_SCHEMA,
  enabled: z.literal(true),
  scripts: z.array(z.unknown()).default([]),
  usesSkillIds: USES_SKILL_IDS_SCHEMA,
});

const validateCreateInput = validatorFactory(CREATE_INPUT_SCHEMA);

const persistCreate = createDb<SkillModel>({
  dao: skillMongodbDao,
  factory: skillFactory,
  validationSchema: CREATE_DB_SCHEMA,
});

const isDuplicateKeyError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return (error as { code?: number }).code === 11000;
};

const findExistingBySpecializationAndName = async ({
  specializationId,
  name,
}: {
  specializationId: string;
  name: string;
}): Promise<SkillModel | null> => {
  const row = await skillMongodbDao.getRaw({ specializationId, name });

  if (!row) {
    return null;
  }

  const rowId = row.id ?? (row as { _id?: string })._id;

  if (!rowId) {
    return null;
  }

  return skillFactory.create({
    ...(row as Partial<SkillModel>),
    id: rowId,
  });
};

const handleDuplicate = async ({
  specializationId,
  name,
  onDuplicate,
}: {
  specializationId: string;
  name: string;
  onDuplicate: CreateSkillCommandInput['onDuplicate'];
}): Promise<CreateSkillCommandResult | null> => {
  const existing = await findExistingBySpecializationAndName({ specializationId, name });

  if (!existing?.id) {
    return null;
  }

  if (onDuplicate === 'returnExisting') {
    return {
      data: existing,
      isNew: false,
    };
  }

  throw new ConflictError('Skill name already exists for this specialization');
};

export const create = async (
  input: CreateSkillCommandInput,
): Promise<CreateSkillCommandResult> => {
  const parsed = validateCreateInput(input);

  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.error);
  }

  const onDuplicate = parsed.data.onDuplicate ?? 'error';
  const name = parsed.data.name.trim();
  const description = parsed.data.description.trim();
  const skillInput = parsed.data.input.trim();
  const skillOutput = parsed.data.output.trim();
  const rule = parsed.data.rule.trim();
  const scripts = parsed.data.scripts ?? [];
  const usesSkillIds = parsed.data.usesSkillIds ?? [];

  const duplicateResult = await handleDuplicate({
    specializationId: parsed.data.specializationId,
    name,
    onDuplicate,
  });

  if (duplicateResult !== null) {
    return duplicateResult;
  }

  try {
    const created = await persistCreate({
      specializationId: parsed.data.specializationId,
      name,
      description,
      input: skillInput,
      output: skillOutput,
      rule,
      enabled: true,
      scripts: [],
      usesSkillIds,
    });

    const skillId = created.data.id!;

    const persistedScripts =
      scripts.length > 0
        ? await persistSkillScripts({
            skillId,
            scripts,
            scriptStorageClient,
          })
        : [];

    if (persistedScripts.length > 0) {
      await skillMongodbDao.update(
        skillFactory.create({ id: skillId }),
        skillFactory.create({ scripts: persistedScripts }),
      );

      const updated = await getModelById({ id: skillId });

      return {
        data: updated.data,
        isNew: true,
      };
    }

    return {
      data: created.data,
      isNew: true,
    };
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const racedDuplicate = await handleDuplicate({
      specializationId: parsed.data.specializationId,
      name,
      onDuplicate,
    });

    if (racedDuplicate !== null) {
      return racedDuplicate;
    }

    throw new ConflictError('Skill name already exists for this specialization', error);
  }
};
