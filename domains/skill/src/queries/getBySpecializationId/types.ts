import type { SkillModel } from '../../model';

export interface GetBySpecializationIdParams {
  specializationId: string;
  page?: number;
  size?: number;
  search?: string;
}

export interface BuildBySpecializationIdFilterParams {
  specializationId: string;
  search?: string;
}

export interface GetBySpecializationIdResult {
  items: SkillModel[];
  page: number;
  size: number;
  totalCount: number;
}
