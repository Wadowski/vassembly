import type { AuthTokenRole } from '@vassembly/domain-auth-token';

import type { ModeledProviderClient } from '../../clients/langchain';

export interface ResolveAndBuildClientParams {
  userId: string;
  role: AuthTokenRole;
  connectionOverride?: {
    integrationCredentialId: string;
  };
}

export type ResolveAndBuildClientResult = ModeledProviderClient;
