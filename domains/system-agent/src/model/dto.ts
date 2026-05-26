import type { AgentCategory, AgentStatus } from '../constants';

export interface SystemAgentAdminResponse {
  id: string;
  name: string;
  description?: string;
  rule: string;
  category?: AgentCategory;
  status: AgentStatus;
  createdByAdminId: string;
  updatedByAdminId: string;
  createdAt: string;
  updatedAt: string;
  removedAt: string | null;
}

export interface SystemAgentPreferenceResponse {
  userId: string;
  integrationCredentialId: string;
  updatedAt: string;
}
