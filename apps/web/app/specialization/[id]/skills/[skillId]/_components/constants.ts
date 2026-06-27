import type { SkillScriptLanguage } from './types';

export const LANGUAGE_MAP: Record<SkillScriptLanguage, string> = {
  python: 'python',
  nodejs: 'javascript',
  bash: 'bash',
};

export const EMPTY_SCRIPTS_MESSAGE = 'No scripts bundled with this skill.';

export const NOT_FOUND_MESSAGE = 'Skill not found.';

export const DETAIL_ERROR_MESSAGE = 'Unable to load skill details. Please try again.';

export const SCRIPT_CONTENT_ERROR_MESSAGE = 'Unable to load script content.';
