import { SystemAgentCategory } from '@vassembly/ui-api-hooks';

export const SYSTEM_AGENT_NAME_MAX = 100;
export const SYSTEM_AGENT_RULE_MAX = 5000;
export const SYSTEM_AGENT_DESCRIPTION_MAX = 500;

export const SYSTEM_AGENT_CATEGORY_OPTIONS: Array<{
  value: SystemAgentCategory;
  label: string;
}> = [
  { value: SystemAgentCategory.Coding, label: 'Coding' },
  { value: SystemAgentCategory.Utility, label: 'Utility' },
  { value: SystemAgentCategory.Onboarding, label: 'Onboarding' },
  { value: SystemAgentCategory.Compliance, label: 'Compliance' },
];
