import type { ModeledProviderClient } from '../../clients/langchain';

export interface ResolveAndBuildClientParams {
  userId: string;
  connectionOverride?: {
    integrationCredentialId: string;
  };
}

export type ResolveAndBuildClientResult = ModeledProviderClient;
