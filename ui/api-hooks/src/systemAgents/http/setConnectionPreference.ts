import type { HttpClient } from '../../http/types';

import type { SetConnectionPreferenceInput, SystemAgentPreference } from '../types';

export interface SetConnectionPreferenceParams {
  client: HttpClient;
  input: SetConnectionPreferenceInput;
}

export const setConnectionPreference = async ({
  client,
  input,
}: SetConnectionPreferenceParams): Promise<SystemAgentPreference> =>
  client.put<SetConnectionPreferenceInput, SystemAgentPreference>({
    path: '/system-agents/connection-preference',
    body: input,
    withAuth: true,
  });
