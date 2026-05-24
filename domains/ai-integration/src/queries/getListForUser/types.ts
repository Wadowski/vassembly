import type { AiIntegrationCredentialModel } from '../../model';
import type { AiIntegrationProviderValue, AiIntegrationStatusValue } from '../../types';

export const AI_INTEGRATION_LIST_ALL_STATUSES = 'all' as const;

export type AiIntegrationListStatusFilter =
  | AiIntegrationStatusValue
  | typeof AI_INTEGRATION_LIST_ALL_STATUSES;

export interface GetListForUserQueryInput {
  userId: string;
  page: number;
  size: number;
  search?: string;
  status?: AiIntegrationListStatusFilter;
  provider?: AiIntegrationProviderValue;
}

export interface GetListForUserQueryResult {
  items: AiIntegrationCredentialModel[];
  totalCount: number;
  page: number;
  size: number;
}

export interface BuildFilterParams {
  userId: string;
  search?: string;
  status: AiIntegrationListStatusFilter;
  provider?: string;
}