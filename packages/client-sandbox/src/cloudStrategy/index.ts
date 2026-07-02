import { InternalError } from '@vassembly/errors';

import type { ExecutionResult, SandboxBackendStrategy } from '../types';

import type { CloudStrategyParams } from './types';

const buildWorkerUrl = ({ workerUrl, path }: { workerUrl: string; path: string }): string =>
  `${workerUrl.replace(/\/$/, '')}${path}`;

const buildHeaders = ({ apiKey }: { apiKey?: string }): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (apiKey !== undefined) {
    headers['X-Api-Key'] = apiKey;
  }

  return headers;
};

export const CloudFirecrackerSandboxBackend = ({
  workerUrl,
  apiKey,
}: CloudStrategyParams): SandboxBackendStrategy => {
  const headers = buildHeaders({ apiKey });

  return {
    execute: async (params) => {
      const response = await fetch(buildWorkerUrl({ workerUrl, path: '/execute' }), {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new InternalError(`Cloud sandbox worker returned status ${response.status}`);
      }

      return response.json() as Promise<ExecutionResult>;
    },

    deleteWorkspace: async ({ workspaceId }) => {
      const response = await fetch(
        buildWorkerUrl({ workerUrl, path: `/workspace/${workspaceId}` }),
        { method: 'DELETE', headers: apiKey !== undefined ? { 'X-Api-Key': apiKey } : {} },
      );

      if (!response.ok) {
        throw new InternalError(`Cloud sandbox worker returned status ${response.status}`);
      }
    },
  };
};
