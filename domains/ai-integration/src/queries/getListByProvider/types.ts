import type { AiIntegrationCredentialModel } from '../../model';
import type { AiIntegrationProviderValue } from '../../types';

export interface GetListByProviderQueryInput {
  userId: string;
  provider: AiIntegrationProviderValue;
}

export interface GetListByProviderQueryResult {
  items: AiIntegrationCredentialModel[];
}
