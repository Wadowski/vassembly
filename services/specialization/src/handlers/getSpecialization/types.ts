import type { SpecializationResponse } from '@vassembly/domain-specialization';

export interface GetSpecializationInput {
  id: string;
}

export interface GetSpecializationResult {
  specialization: SpecializationResponse;
}
