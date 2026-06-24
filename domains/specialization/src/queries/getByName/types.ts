import type { SpecializationResponse } from '../../model';

export interface GetByNameParams {
  name: string;
}

export interface GetByNameResult {
  data: SpecializationResponse;
}
