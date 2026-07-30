export const SKILL_NAME_MAX = 64;
export const SKILL_DESCRIPTION_MAX = 1024;
export const SKILL_INPUT_MAX = 512;
export const SKILL_OUTPUT_MAX = 512;
export const SKILL_RULE_MAX = 32_000;
export const SKILL_SCRIPT_MAX_COUNT = 10;
export const SKILL_RULE_MIN_ROWS = 8;
export const SKILL_SCRIPT_CONTENT_MIN_ROWS = 6;

export const SKILL_SCRIPT_LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'bash', label: 'Bash' },
] as const;
