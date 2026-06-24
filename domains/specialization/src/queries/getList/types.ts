import type { SpecializationResponse } from '../../model';

export interface GetListParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface GetListResult {
  items: SpecializationResponse[];
  total: number;
  page: number;
  size: number;
}

export interface BuildListFilterParams {
  search?: string;
}
