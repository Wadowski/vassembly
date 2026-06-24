import type { SpecializationModel } from '../../model';

export interface GetModelByIdParams {
  id: string;
}

export interface GetModelByIdResult {
  data: SpecializationModel;
}
