import type { SystemAgentAdminResponse } from '@vassembly/domain-system-agent';

export interface GetSystemAgentParams {
  adminUserId: string;
  systemAgentId: string;
}

export interface GetSystemAgentResult {
  systemAgent: SystemAgentAdminResponse;
}
