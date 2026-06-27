import type { SkillScriptLanguage } from '../../model';

export interface SkillScriptInput {
  filename: string;
  language: SkillScriptLanguage;
  content: string;
}

export type SkillDuplicateBehavior = 'error' | 'returnExisting';
