import { AiIntegrationProvider } from '@vassembly/domain-ai-integration';

import type {
  AiIntegrationCredentialResponse,
  AiIntegrationListStatusFilter,
} from '@vassembly/domain-ai-integration';

type AiIntegrationProviderFilter = (typeof AiIntegrationProvider)[keyof typeof AiIntegrationProvider];

export interface ListCredentialsHandlerInput {
  userId: string;
  page: number;
  size: number;
  search?: string;
  status?: AiIntegrationListStatusFilter;
  provider?: AiIntegrationProviderFilter;
}

export interface ListCredentialsHandlerOutput {
  items: AiIntegrationCredentialResponse[];
  totalCount: number;
  page: number;
  size: number;
}
