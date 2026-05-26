import type { SystemAgentPreferenceResponse } from '@vassembly/domain-system-agent';

export interface GetConnectionPreferenceParams {
  userId: string;
  targetUserId?: string;
}

export interface GetConnectionPreferenceResult {
  preference: SystemAgentPreferenceResponse;
}
