import { ModelWithTranslation } from '@vassembly/model';

export enum AgentCategory {
  Coding = 'coding',
  Personal = 'personal',
  Utility = 'utility',
}

export enum AgentStatus {
  Active = 'active',
  Archived = 'archived',
  Disabled = 'disabled',
}

export class AgentModel extends ModelWithTranslation {
  name?: string;

  category?: AgentCategory;

  description?: string;

  rule?: string;

  userId?: string;

  status?: AgentStatus;

  integrationCredentialId?: string;

  assignedMcpIds?: string[];
}
