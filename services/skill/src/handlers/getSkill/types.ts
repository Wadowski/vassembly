import type { SkillResponse } from '@vassembly/domain-skill';

export interface GetSkillInput {
  id: string;
}

export interface GetSkillResult {
  skill: SkillResponse;
}
