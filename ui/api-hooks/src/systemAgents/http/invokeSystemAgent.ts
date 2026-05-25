import type { HttpClient } from '../../http/types';

import type { InvokeSystemAgentRequest, InvokeSystemAgentResponse } from '../types';

import { resolveSystemAgentIdPath } from './resolveSystemAgentIdPath';

export interface InvokeSystemAgentParams {
  client: HttpClient;
  id: string;
  input: InvokeSystemAgentRequest;
  onChunk?: (chunk: string) => void;
}

export const invokeSystemAgent = async ({
  client,
  id,
  input,
}: InvokeSystemAgentParams): Promise<InvokeSystemAgentResponse> => {
  const path = resolveSystemAgentIdPath(id);

  if (path === undefined) {
    throw new Error('System agent id is required');
  }

  return client.post<InvokeSystemAgentRequest, InvokeSystemAgentResponse>({
    path: `${path}/invoke`,
    body: input,
    withAuth: true,
  });
};
