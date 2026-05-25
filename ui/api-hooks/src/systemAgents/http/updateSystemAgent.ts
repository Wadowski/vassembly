import type { HttpClient } from '../../http/types';

import type { SystemAgentAdminResponse, UpdateSystemAgentInput } from '../types';

import { resolveSystemAgentIdPath } from './resolveSystemAgentIdPath';

export interface UpdateSystemAgentParams {
  client: HttpClient;
  id: string;
  input: UpdateSystemAgentInput;
}

export const updateSystemAgent = async ({
  client,
  id,
  input,
}: UpdateSystemAgentParams): Promise<SystemAgentAdminResponse> => {
  const path = resolveSystemAgentIdPath(id);

  if (path === undefined) {
    throw new Error('System agent id is required');
  }

  return client.patch<UpdateSystemAgentInput, SystemAgentAdminResponse>({
    path,
    body: input,
    withAuth: true,
  });
};
