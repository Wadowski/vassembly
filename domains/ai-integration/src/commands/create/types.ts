import type { AiIntegrationProviderValue } from '../../types';

export interface CreateAiIntegrationCommandInput {
  userId: string;
  name: string;
  provider: AiIntegrationProviderValue;
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
}
