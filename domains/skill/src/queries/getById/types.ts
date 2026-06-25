import type { SkillResponse } from '../../model';

export interface GetByIdParams {
  id: string;
}

export interface GetByIdResult {
  data: SkillResponse;
}
