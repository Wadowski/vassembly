import type { HttpClient } from '../../http/types';

import type { SystemAgentAdminResponse } from '../types';

import { resolveSystemAgentIdPath } from './resolveSystemAgentIdPath';

export interface RestoreSystemAgentParams {
  client: HttpClient;
  id: string;
}

export const restoreSystemAgent = async ({
  client,
  id,
}: RestoreSystemAgentParams): Promise<SystemAgentAdminResponse> => {
  const path = resolveSystemAgentIdPath(id);

  if (path === undefined) {
    throw new Error('System agent id is required');
  }

  return client.post<Record<string, never>, SystemAgentAdminResponse>({
    path: `${path}/restore`,
    body: {},
    withAuth: true,
  });
};
