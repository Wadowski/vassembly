import type { SystemAgentModel } from '../../model';

export interface RemoveSoftParams {
  id: string;
  updatedByAdminId: string;
}

export interface RemoveSoftResult {
  data: SystemAgentModel;
}
