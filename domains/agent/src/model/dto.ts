import type { AgentCategory, AgentStatus } from './model';

export interface AgentResponse {
  id?: string;
  name?: string;
  category?: AgentCategory;
  description?: string;
  rule?: string;
  userId?: string;
  status?: AgentStatus;
  integrationCredentialId?: string;
  assignedMcpIds: string[];
  createdAt?: string;
  updatedAt?: string;
  removedAt?: string | null;
}
