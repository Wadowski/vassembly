import type { SystemAgentAdminResponse } from '@vassembly/domain-system-agent';

export interface ArchiveSystemAgentParams {
  adminUserId: string;
  systemAgentId: string;
}

export interface ArchiveSystemAgentResult {
  systemAgent: SystemAgentAdminResponse;
}
