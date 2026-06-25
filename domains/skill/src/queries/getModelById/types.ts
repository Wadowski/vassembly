import type { SkillModel } from '../../model';

export interface GetModelByIdParams {
  id: string;
}

export interface GetModelByIdResult {
  data: SkillModel;
}
