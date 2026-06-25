import { SKILL_SCRIPT_LANGUAGES } from '../constants';

export const SKILL_SCRIPT_LANGUAGES_VALUES = SKILL_SCRIPT_LANGUAGES;

export type SkillScriptLanguage = (typeof SKILL_SCRIPT_LANGUAGES)[number];

export interface SkillScript {
  filename: string;
  language: SkillScriptLanguage;
  storageKey: string;
}
