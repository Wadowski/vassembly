import type { UserSystemAgentPreferenceModel } from '../../model';

export interface GetPreferenceByUserIdParams {
  userId: string;
}

export interface GetPreferenceByUserIdResult {
  data: UserSystemAgentPreferenceModel | null;
  error?: unknown;
}
