import specializationDomain from '@vassembly/domain-specialization';
import skillDomain, { toSkillResponse } from '@vassembly/domain-skill';
import { NotFoundError } from '@vassembly/errors';

import type { CreateSkillInput, CreateSkillResult } from './types';

export const createSkill = async (input: CreateSkillInput): Promise<CreateSkillResult> => {
  const specialization = await specializationDomain.queries.getModelById({
    id: input.specializationId,
  });

  if (!specialization.data?.id) {
    throw new NotFoundError('Specialization not found');
  }

  const result = await skillDomain.commands.create({
    specializationId: input.specializationId,
    name: input.name,
    description: input.description,
    rule: input.rule,
    scripts: input.scripts,
    onDuplicate: 'error',
  });

  return {
    skill: toSkillResponse({ skill: result.data }),
  };
};
