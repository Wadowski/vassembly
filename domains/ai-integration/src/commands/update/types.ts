import type { AiIntegrationProviderValue, AiIntegrationStatusValue } from '../../types';

export interface UpdateAiIntegrationCommandData {
  name?: string;
  provider?: AiIntegrationProviderValue;
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  model?: string;
  status?: AiIntegrationStatusValue;
  connectionStatus?: string;
  lastTestedAt?: Date;
  lastConnectionError?: string;
}

export interface UpdateAiIntegrationCommandInput {
  userId: string;
  id: string;
  data: UpdateAiIntegrationCommandData;
}
