import { AgentCategory } from '@vassembly/ui-api-hooks';

export const AGENT_NAME_MAX = 100;
export const AGENT_DESCRIPTION_MAX = 500;
export const AGENT_RULE_MAX = 2000;

export const AGENT_CATEGORY_OPTIONS: ReadonlyArray<{ value: AgentCategory; label: string }> = [
  { value: AgentCategory.Coding, label: 'coding' },
  { value: AgentCategory.Personal, label: 'personal' },
  { value: AgentCategory.Utility, label: 'utility' },
];
