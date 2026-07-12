import { NotFoundError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { getModelById } from '../getModelById';

import type { SkillModel } from '../../model';
import type { GetActiveRuleByIdParams, GetActiveRuleByIdResult } from './types';

const QUERY_INPUT_SCHEMA = z.object({
  skillId: z.string().trim().min(1),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

const isActiveSkill = (skill: Pick<SkillModel, 'enabled' | 'removedAt'>): boolean => {
  if (skill.enabled !== true) {
    return false;
  }

  const removedAt = skill.removedAt;
  return removedAt === null || removedAt === undefined;
};

export const getActiveRuleById = async (
  input: GetActiveRuleByIdParams,
): Promise<GetActiveRuleByIdResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const { data: skill } = await getModelById({ id: parsed.data.skillId });

  if (!isActiveSkill(skill)) {
    throw new NotFoundError(`Skill id "${parsed.data.skillId}" not found or not active`);
  }

  return {
    skillId: skill.id!,
    specializationId: skill.specializationId!,
    name: skill.name!,
    rule: skill.rule!,
    scripts: skill.scripts ?? [],
    usesSkillIds: skill.usesSkillIds ?? [],
  };
};

export type { GetActiveRuleByIdParams, GetActiveRuleByIdResult } from './types';
