import type { HttpClient } from '../../http/types';

import type { SystemAgentAdminResponse } from '../types';

import { resolveSystemAgentIdPath } from './resolveSystemAgentIdPath';

export interface ArchiveSystemAgentParams {
  client: HttpClient;
  id: string;
}

export const archiveSystemAgent = async ({
  client,
  id,
}: ArchiveSystemAgentParams): Promise<SystemAgentAdminResponse> => {
  const path = resolveSystemAgentIdPath(id);

  if (path === undefined) {
    throw new Error('System agent id is required');
  }

  return client.delete<SystemAgentAdminResponse>({
    path,
    withAuth: true,
  });
};
