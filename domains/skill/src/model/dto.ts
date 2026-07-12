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
  enabled: boolean;
  scripts: SkillScriptResponse[];
  usesSkillIds: string[];
  createdAt: string;
  updatedAt: string;
  removedAt: string | null;
}

export interface SkillListResponse {
  items: SkillResponse[];
}
