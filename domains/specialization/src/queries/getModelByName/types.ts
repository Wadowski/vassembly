import type { SpecializationModel } from '../../model';

export interface GetModelByNameParams {
  name: string;
}

export interface GetModelByNameResult {
  data: SpecializationModel;
}
