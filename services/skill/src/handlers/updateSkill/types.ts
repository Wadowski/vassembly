import type { SkillScriptLanguage } from '@vassembly/domain-skill';

export interface SkillScriptWriteInput {
  filename: string;
  language: SkillScriptLanguage;
  content: string;
}

export interface UpdateSkillInput {
  skillId: string;
  description?: string;
  rule?: string;
  enabled?: boolean;
  scripts?: SkillScriptWriteInput[];
  usesSkillIds?: string[];
}

export interface UpdateSkillResult {
  skill: import('@vassembly/domain-skill').SkillResponse;
}
