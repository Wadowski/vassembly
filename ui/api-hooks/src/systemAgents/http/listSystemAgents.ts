import type { HttpClient } from '../../http/types';

import type { ListSystemAgentsInput, ListSystemAgentsOutput } from '../types';

export interface ListSystemAgentsParams {
  client: HttpClient;
  input?: ListSystemAgentsInput;
}

export const listSystemAgents = async ({
  client,
  input = {},
}: ListSystemAgentsParams): Promise<ListSystemAgentsOutput> =>
  client.get<ListSystemAgentsOutput>({
    path: '/system-agents',
    query: input as Record<string, string | number | boolean>,
    withAuth: true,
  });
