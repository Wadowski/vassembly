import type { UserSystemAgentPreferenceModel } from '../../model';

export interface UpsertPreferenceParams {
  userId: string;
  integrationCredentialId: string;
}

export interface UpsertPreferenceResult {
  data: UserSystemAgentPreferenceModel;
}
