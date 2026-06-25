import type { SkillScriptLanguage } from './types';

export type { SkillScriptLanguage } from './types';

export interface SkillScriptResponse {
  filename: string;
  language: SkillScriptLanguage;
}

export interface SkillResponse {
  id: string;
  specializationId: string;
  name: string;
  description: string;
  rule: string;
  scripts: SkillScriptResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillListResponse {
  items: SkillResponse[];
}
