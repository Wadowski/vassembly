import type { AgentCategory } from '@vassembly/domain-system-agent';
import type { SystemAgentAdminResponse } from '@vassembly/domain-system-agent';

export interface CreateSystemAgentParams {
  adminUserId: string;
  body: {
    name: string;
    rule: string;
    description?: string;
    category?: AgentCategory;
  };
}

export interface CreateSystemAgentResult {
  systemAgent: SystemAgentAdminResponse;
}
