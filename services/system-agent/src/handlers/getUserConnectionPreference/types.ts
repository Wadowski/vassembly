import type { AuthTokenRole } from '@vassembly/domain-auth-token';
import type { SystemAgentPreferenceResponse } from '@vassembly/domain-system-agent';

export interface GetUserConnectionPreferenceParams {
  adminUserId: string;
  role: AuthTokenRole;
  targetUserId: string;
}

export interface GetUserConnectionPreferenceResult {
  preference: SystemAgentPreferenceResponse;
}
