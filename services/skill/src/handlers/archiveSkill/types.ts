import type { SkillResponse } from '@vassembly/domain-skill';

export interface ArchiveSkillParams {
  adminUserId: string;
  skillId: string;
}

export interface ArchiveSkillResult {
  skill: SkillResponse;
}
