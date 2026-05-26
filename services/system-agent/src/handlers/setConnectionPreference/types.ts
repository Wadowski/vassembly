import type { AuthTokenRole } from '@vassembly/domain-auth-token';
import type { SystemAgentPreferenceResponse } from '@vassembly/domain-system-agent';

export interface SetConnectionPreferenceParams {
  userId: string;
  role: AuthTokenRole;
  integrationCredentialId: string;
}

export interface SetConnectionPreferenceResult {
  preference: SystemAgentPreferenceResponse;
}
