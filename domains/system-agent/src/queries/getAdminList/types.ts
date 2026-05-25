import type { AgentStatus, SystemAgentAdminResponse } from '../../model';

export interface GetAdminListParams {
  status?: AgentStatus;
  search?: string;
  page?: number;
  size?: number;
}

export interface GetAdminListResult {
  items: SystemAgentAdminResponse[];
  page: number;
  size: number;
  totalCount: number;
}

export interface BuildAdminListFilterParams {
  status?: AgentStatus;
  search?: string;
}
