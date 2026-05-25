import type { AuthTokenRole } from '@vassembly/domain-auth-token';
import type { SystemAgentPreferenceResponse } from '@vassembly/domain-system-agent';

export interface GetConnectionPreferenceParams {
  userId: string;
  role: AuthTokenRole;
  targetUserId?: string;
}

export interface GetConnectionPreferenceResult {
  preference: SystemAgentPreferenceResponse;
}
