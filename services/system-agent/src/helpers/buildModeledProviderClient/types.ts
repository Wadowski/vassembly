import type { AiIntegrationCredentialModel } from '@vassembly/domain-ai-integration';
import type { ModeledProviderClient } from '@vassembly/domain-ai-integration/src/clients/langchain';

export interface BuildModeledProviderClientParams {
  credential: Pick<
    AiIntegrationCredentialModel,
    'provider' | 'encryptedApiKey' | 'baseUrl' | 'organizationId' | 'model' | 'status'
  >;
}

export type BuildModeledProviderClientResult = ModeledProviderClient;
