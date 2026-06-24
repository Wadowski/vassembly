import type { SpecializationResponse } from '../../model';

export interface GetByIdParams {
  id: string;
}

export interface GetByIdResult {
  data: SpecializationResponse;
}
