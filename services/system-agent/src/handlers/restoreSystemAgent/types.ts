import type { AuthTokenRole } from '@vassembly/domain-auth-token';
import type { SystemAgentAdminResponse } from '@vassembly/domain-system-agent';

export interface RestoreSystemAgentParams {
  adminUserId: string;
  role: AuthTokenRole;
  systemAgentId: string;
}

export interface RestoreSystemAgentResult {
  systemAgent: SystemAgentAdminResponse;
}
