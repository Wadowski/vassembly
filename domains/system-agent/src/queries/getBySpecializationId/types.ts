import type { SystemAgentModel } from '../../model';

export interface GetBySpecializationIdParams {
  specializationId: string;
}

export interface GetBySpecializationIdResult {
  items: SystemAgentModel[];
}
