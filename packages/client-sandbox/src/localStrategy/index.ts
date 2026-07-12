import { InternalError } from '@vassembly/errors';

import type { ExecutionResult, SandboxBackendStrategy } from '../types';

import type { LocalStrategyParams } from './types';

const buildWorkerUrl = ({ workerUrl, path }: { workerUrl: string; path: string }): string =>
  `${workerUrl.replace(/\/$/, '')}${path}`;

export const LocalDockerSandboxBackend = ({
  workerUrl,
}: LocalStrategyParams): SandboxBackendStrategy => ({
  execute: async (params) => {
    const response = await fetch(buildWorkerUrl({ workerUrl, path: '/execute' }), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new InternalError(`Local sandbox worker returned status ${response.status}`);
    }

    return response.json() as Promise<ExecutionResult>;
  },

  deleteWorkspace: async ({ workspaceId }) => {
    const response = await fetch(
      buildWorkerUrl({ workerUrl, path: `/workspace/${workspaceId}` }),
      { method: 'DELETE' },
    );

    if (!response.ok) {
      throw new InternalError(`Local sandbox worker returned status ${response.status}`);
    }
  },
});
