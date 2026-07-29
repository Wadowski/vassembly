import type { SkillScriptLanguage } from '@vassembly/domain-skill';

export interface SkillScriptWriteInput {
  filename: string;
  language: SkillScriptLanguage;
  content: string;
}

export interface CreateSkillInput {
  specializationId: string;
  name: string;
  description: string;
  input: string;
  output: string;
  rule: string;
  scripts?: SkillScriptWriteInput[];
  usesSkillIds?: string[];
}

export interface CreateSkillResult {
  skill: import('@vassembly/domain-skill').SkillResponse;
}
