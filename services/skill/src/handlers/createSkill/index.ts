import specializationDomain from '@vassembly/domain-specialization';
import skillDomain, { toSkillResponse } from '@vassembly/domain-skill';
import { NotFoundError } from '@vassembly/errors';

import { validateUsesSkillIds } from '../shared/validateUsesSkillIds';

import type { CreateSkillInput, CreateSkillResult } from './types';

export const createSkill = async (input: CreateSkillInput): Promise<CreateSkillResult> => {
  const specialization = await specializationDomain.queries.getModelById({
    id: input.specializationId,
  });

  if (!specialization.data?.id) {
    throw new NotFoundError('Specialization not found');
  }

  const usesSkillIds = input.usesSkillIds ?? [];

  await validateUsesSkillIds({
    specializationId: input.specializationId,
    usesSkillIds,
  });

  const result = await skillDomain.commands.create({
    specializationId: input.specializationId,
    name: input.name,
    description: input.description,
    input: input.input,
    output: input.output,
    rule: input.rule,
    scripts: input.scripts,
    usesSkillIds,
    onDuplicate: 'error',
  });

  return {
    skill: toSkillResponse({ skill: result.data }),
  };
};
