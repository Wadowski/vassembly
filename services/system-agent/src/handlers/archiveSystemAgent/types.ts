import type { AuthTokenRole } from '@vassembly/domain-auth-token';
import type { SystemAgentAdminResponse } from '@vassembly/domain-system-agent';

export interface ArchiveSystemAgentParams {
  adminUserId: string;
  role: AuthTokenRole;
  systemAgentId: string;
}

export interface ArchiveSystemAgentResult {
  systemAgent: SystemAgentAdminResponse;
}
