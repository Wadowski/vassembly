import type { HttpClient } from '../../http/types';

import type { CreateSystemAgentInput, SystemAgentAdminResponse } from '../types';

export interface CreateSystemAgentParams {
  client: HttpClient;
  input: CreateSystemAgentInput;
}

export const createSystemAgent = async ({
  client,
  input,
}: CreateSystemAgentParams): Promise<SystemAgentAdminResponse> =>
  client.post<CreateSystemAgentInput, SystemAgentAdminResponse>({
    path: '/system-agents',
    body: input,
    withAuth: true,
  });
