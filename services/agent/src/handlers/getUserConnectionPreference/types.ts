import type { SystemAgentPreferenceResponse } from '@vassembly/domain-system-agent';

export interface GetUserConnectionPreferenceParams {
  adminUserId: string;
  targetUserId: string;
}

export interface GetUserConnectionPreferenceResult {
  preference: SystemAgentPreferenceResponse;
}
