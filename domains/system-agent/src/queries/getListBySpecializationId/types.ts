import type { SystemAgentAdminResponse } from '../../model';

export interface GetListBySpecializationIdParams {
  specializationId: string;
  page?: number;
  size?: number;
  search?: string;
}

export interface BuildListBySpecializationIdFilterParams {
  specializationId: string;
  search?: string;
}

export interface GetListBySpecializationIdResult {
  items: SystemAgentAdminResponse[];
  page: number;
  size: number;
  totalCount: number;
}
