import type { SystemAgentModel } from '../../model';

export interface GetActiveByNameParams {
  name: string;
}

export interface GetActiveByNameResult {
  data: SystemAgentModel;
}
