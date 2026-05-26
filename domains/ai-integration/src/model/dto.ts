import type {
  AiIntegrationConnectionStatusValue,
  AiIntegrationProviderValue,
  AiIntegrationStatusValue,
} from '../types';

export interface AiIntegrationCredentialResponse {
  id?: string;
  userId?: string;
  name?: string;
  provider?: AiIntegrationProviderValue;
  hasApiKey?: boolean;
  apiKeyHint?: string | null;
  baseUrl?: string;
  organizationId?: string;
  status?: AiIntegrationStatusValue;
  connectionStatus?: AiIntegrationConnectionStatusValue;
  lastTestedAt?: string;
  lastConnectionError?: string;
  model?: string;
  agentUsageCount?: number;
  createdAt?: string;
  updatedAt?: string;
  removedAt?: string | null;
}
