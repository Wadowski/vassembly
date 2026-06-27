import skillDomain, { toSkillResponse } from '@vassembly/domain-skill';

import type { UpdateSkillInput, UpdateSkillResult } from './types';

export const updateSkill = async (input: UpdateSkillInput): Promise<UpdateSkillResult> => {
  const result = await skillDomain.commands.update({
    id: input.skillId,
    description: input.description,
    rule: input.rule,
    enabled: input.enabled,
    scripts: input.scripts,
  });

  return {
    skill: toSkillResponse({ skill: result.data }),
  };
};
