import type { AgentStatus, SystemAgentAdminResponse } from '@vassembly/domain-system-agent';

export interface ListSystemAgentsParams {
  adminUserId: string;
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
