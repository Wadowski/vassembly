import type { AuthTokenRole } from '@vassembly/domain-auth-token';

export interface InvokeSystemAgentParams {
  userId: string;
  role: AuthTokenRole;
  systemAgentId: string;
  message: string;
  connectionOverride?: {
    integrationCredentialId: string;
  };
}

export interface InvokeSystemAgentResult {
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: {
    model: string;
    provider: string;
  };
}
