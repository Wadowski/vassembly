import type { SystemAgentAdminResponse } from '../../model';

export interface GetActiveByIdParams {
  id: string;
}

export interface GetActiveByIdResult {
  data: SystemAgentAdminResponse | null;
  error?: unknown;
}
