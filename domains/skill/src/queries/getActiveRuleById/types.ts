import type { SkillScript } from '../../model/types';

export interface GetActiveRuleByIdParams {
  skillId: string;
}

export interface GetActiveRuleByIdResult {
  skillId: string;
  specializationId: string;
  name: string;
  rule: string;
  scripts: SkillScript[];
  usesSkillIds: string[];
}
