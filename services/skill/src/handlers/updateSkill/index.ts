import skillDomain, { toSkillResponse } from '@vassembly/domain-skill';
import { NotFoundError } from '@vassembly/errors';

import { validateUsesSkillIds } from '../shared/validateUsesSkillIds';

import type { UpdateSkillInput, UpdateSkillResult } from './types';

export const updateSkill = async (input: UpdateSkillInput): Promise<UpdateSkillResult> => {
  if (input.usesSkillIds !== undefined) {
    const existing = await skillDomain.queries.getModelById({ id: input.skillId });

    if (!existing.data?.id) {
      throw new NotFoundError('Skill not found');
    }

    await validateUsesSkillIds({
      specializationId: existing.data.specializationId!,
      skillId: input.skillId,
      usesSkillIds: input.usesSkillIds,
    });
  }

  const result = await skillDomain.commands.update({
    id: input.skillId,
    description: input.description,
    input: input.input,
    output: input.output,
    rule: input.rule,
    enabled: input.enabled,
    scripts: input.scripts,
    usesSkillIds: input.usesSkillIds,
  });

  return {
    skill: toSkillResponse({ skill: result.data }),
  };
};
