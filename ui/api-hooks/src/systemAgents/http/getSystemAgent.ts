import type { HttpClient } from '../../http/types';

import type { SystemAgentAdminResponse } from '../types';

import { resolveSystemAgentIdPath } from './resolveSystemAgentIdPath';

export interface GetSystemAgentParams {
  client: HttpClient;
  id: string;
}

export const getSystemAgent = async ({
  client,
  id,
}: GetSystemAgentParams): Promise<SystemAgentAdminResponse> => {
  const path = resolveSystemAgentIdPath(id);

  if (path === undefined) {
    throw new Error('System agent id is required');
  }

  return client.get<SystemAgentAdminResponse>({
    path,
    withAuth: true,
  });
};
