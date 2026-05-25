import type { SystemAgentAdminResponse } from '../../model';

export interface GetByIdParams {
  id: string;
}

export interface GetByIdResult {
  data: SystemAgentAdminResponse | null;
  error?: unknown;
}
