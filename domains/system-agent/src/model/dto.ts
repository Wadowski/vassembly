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

export interface SystemAgentCatalogListItem {
  id: string;
  name: string;
  description?: string;
  category?: AgentCategory;
  status: AgentStatus;
}

export interface SystemAgentCatalogDetail extends SystemAgentCatalogListItem {
  rule: string;
}

export interface SystemAgentPreferenceResponse {
  userId: string;
  integrationCredentialId: string;
  updatedAt: string;
}
