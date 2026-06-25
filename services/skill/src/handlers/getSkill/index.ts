import skillDomain from '@vassembly/domain-skill';

import type { GetSkillInput, GetSkillResult } from './types';

export const getSkill = async (input: GetSkillInput): Promise<GetSkillResult> => {
  const result = await skillDomain.queries.getById({ id: input.id });

  return {
    skill: result.data,
  };
};
