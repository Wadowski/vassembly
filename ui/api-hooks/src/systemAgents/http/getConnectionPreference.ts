import type { HttpClient } from '../../http/types';

import type { SystemAgentPreference } from '../types';

export interface GetConnectionPreferenceParams {
  client: HttpClient;
}

export const getConnectionPreference = async ({
  client,
}: GetConnectionPreferenceParams): Promise<SystemAgentPreference> =>
  client.get<SystemAgentPreference>({
    path: '/system-agents/connection-preference',
    withAuth: true,
  });
