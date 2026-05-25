import type { AuthTokenRole } from '@vassembly/domain-auth-token';
import type { AiIntegrationCredentialModel } from '@vassembly/domain-ai-integration';

export interface ResolveInvokeCredentialParams {
  userId: string;
  role: AuthTokenRole;
  connectionOverride?: {
    integrationCredentialId: string;
  };
}

export type ResolveInvokeCredentialResult = AiIntegrationCredentialModel;
