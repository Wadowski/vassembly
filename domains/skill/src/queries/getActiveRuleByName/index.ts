import { NotFoundError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { SKILL_NAME_MAX_LENGTH } from '../../constants';
import { skillMongodbDao } from '../../clients';

import type { GetActiveRuleByNameParams, GetActiveRuleByNameResult } from './types';

const QUERY_INPUT_SCHEMA = z.object({
  specializationId: z.string().min(1).max(100),
  skillName: z.string().min(1).max(SKILL_NAME_MAX_LENGTH),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

const NOT_FOUND_MESSAGE = (skillName: string): string =>
  `Skill "${skillName}" not found or not active`;

export const getActiveRuleByName = async (
  input: GetActiveRuleByNameParams,
): Promise<GetActiveRuleByNameResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const row = await skillMongodbDao.getRaw({
    specializationId: parsed.data.specializationId,
    name: parsed.data.skillName,
    enabled: true,
    $or: [{ removedAt: { $exists: false } }, { removedAt: null }],
  });

  if (!row) {
    throw new NotFoundError(NOT_FOUND_MESSAGE(parsed.data.skillName));
  }

  return { rule: String(row.rule) };
};

export type { GetActiveRuleByNameParams, GetActiveRuleByNameResult } from './types';
