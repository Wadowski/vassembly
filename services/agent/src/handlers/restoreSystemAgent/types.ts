import type { SystemAgentAdminResponse } from '@vassembly/domain-system-agent';

export interface RestoreSystemAgentParams {
  adminUserId: string;
  systemAgentId: string;
}

export interface RestoreSystemAgentResult {
  systemAgent: SystemAgentAdminResponse;
}
