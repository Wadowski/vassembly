import type { AgentCategory, AgentStatus } from '../../model';

export interface CreateAgentCommandInput {
  userId: string;
  name: string;
  category: AgentCategory;
  description: string;
  rule: string;
  status?: AgentStatus;
  integrationCredentialId?: string;
  assignedMcpIds?: string[];
  assignedToolIds?: string[];
  removedAt?: null;
}
