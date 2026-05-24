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
  apiKeyHint?: string;
  baseUrl?: string;
  organizationId?: string;
  status?: AiIntegrationStatusValue;
  connectionStatus?: AiIntegrationConnectionStatusValue;
  lastTestedAt?: string;
  lastConnectionError?: string;
  agentUsageCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  removedAt?: Date | null;
}
