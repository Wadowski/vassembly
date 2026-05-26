import type { SystemAgentModel } from '../../model';

export interface RestoreParams {
  id: string;
  restoredByAdminId: string;
}

export interface RestoreResult {
  data: SystemAgentModel;
}
