import type { SystemAgentAdminResponse } from '@vassembly/domain-system-agent';

export interface ListAgentsBySpecializationParams {
  adminUserId: string;
  specializationId: string;
  page?: number;
  size?: number;
  search?: string;
}

export interface ListAgentsBySpecializationResult {
  items: SystemAgentAdminResponse[];
  total: number;
  page: number;
  size: number;
}
