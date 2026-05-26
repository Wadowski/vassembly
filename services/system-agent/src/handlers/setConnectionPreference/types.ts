import type { SystemAgentPreferenceResponse } from '@vassembly/domain-system-agent';

export interface SetConnectionPreferenceParams {
  userId: string;
  integrationCredentialId: string;
}

export interface SetConnectionPreferenceResult {
  preference: SystemAgentPreferenceResponse;
}
