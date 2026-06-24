import type { SpecializationResponse } from '@vassembly/domain-specialization';

export interface ListSpecializationsInput {
  page: number;
  size: number;
  search?: string;
}

export interface ListSpecializationsResult {
  items: SpecializationResponse[];
  page: number;
  size: number;
  total: number;
}
