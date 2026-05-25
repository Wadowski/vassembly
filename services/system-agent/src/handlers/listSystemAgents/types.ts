import type { AuthTokenRole } from '@vassembly/domain-auth-token';
import type { AgentStatus, SystemAgentAdminResponse } from '@vassembly/domain-system-agent';

export interface ListSystemAgentsParams {
  adminUserId: string;
  role: AuthTokenRole;
  status?: AgentStatus;
  search?: string;
  page?: number;
  size?: number;
}

export interface ListSystemAgentsResult {
  items: SystemAgentAdminResponse[];
  total: number;
  page: number;
  size: number;
}
