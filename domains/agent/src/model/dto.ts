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
  createdAt?: Date;
  updatedAt?: Date;
  removedAt?: Date | null;
}
