import type { SkillScript } from '../../model/types';

export interface GetActiveRuleByNameParams {
  specializationId: string;
  skillName: string;
}

export interface GetActiveRuleByNameResult {
  skillId: string;
  specializationId: string;
  rule: string;
  scripts: SkillScript[];
}
