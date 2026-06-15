import type { ModeledProviderClient } from '../../clients/langchain';

export interface ResolveAndBuildClientParams {
  userId: string;
  connectionOverride?: {
    integrationCredentialId: string;
  };
}

export interface AiIntegrationSnapshot {
  integrationName: string;
  provider: string;
  model: string;
}

export interface ResolveAndBuildClientResult {
  client: ModeledProviderClient;
  integrationSnapshot: AiIntegrationSnapshot;
}
