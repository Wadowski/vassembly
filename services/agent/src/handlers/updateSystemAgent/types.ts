import type { AgentCategory, AgentStatus, SystemAgentAdminResponse } from '@vassembly/domain-system-agent';

export interface UpdateSystemAgentParams {
  adminUserId: string;
  systemAgentId: string;
  body: {
    name?: string;
    rule?: string;
    description?: string;
    category?: AgentCategory;
    status?: AgentStatus;
  };
}

export interface UpdateSystemAgentResult {
  systemAgent: SystemAgentAdminResponse;
}
