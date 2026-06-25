import type { SkillResponse } from '@vassembly/domain-skill';

export interface ListSkillsBySpecializationInput {
  specializationId: string;
  page?: number;
  size?: number;
  search?: string;
}

export interface ListSkillsBySpecializationResult {
  items: SkillResponse[];
  total: number;
  page: number;
  size: number;
}
