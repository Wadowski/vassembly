export enum AgentStatus {
  Active = 'active',
  Archived = 'archived',
  Disabled = 'disabled',
}

export enum AgentCategory {
  Coding = 'coding',
  Utility = 'utility',
  Onboarding = 'onboarding',
  Compliance = 'compliance',
}

export const SYSTEM_AGENT_NAME_MIN_LENGTH = 1;

export const SYSTEM_AGENT_NAME_MAX_LENGTH = 100;

export const SYSTEM_AGENT_RULE_MIN_LENGTH = 1;

export const SYSTEM_AGENT_RULE_MAX_LENGTH = 5000;

export const SYSTEM_AGENT_DESCRIPTION_MAX_LENGTH = 500;

export const SYSTEM_AGENT_DEFAULT_STATUS = AgentStatus.Active;
