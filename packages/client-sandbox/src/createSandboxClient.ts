import type { ExecutionConfig } from '@vassembly/config';

import { CloudFirecrackerSandboxBackend } from './cloudStrategy';
import { LocalDockerSandboxBackend } from './localStrategy';
import type { SandboxBackendStrategy } from './types';

const BACKEND_FACTORIES: Record<
  ExecutionConfig['backend'],
  (config: ExecutionConfig) => SandboxBackendStrategy
> = {
  local: (config) => LocalDockerSandboxBackend({ workerUrl: config.local.workerUrl }),
  cloud: (config) =>
    CloudFirecrackerSandboxBackend({
      workerUrl: config.cloud.workerUrl,
      apiKey: config.cloud.apiKey,
    }),
};

export const createSandboxClient = (config: ExecutionConfig): SandboxBackendStrategy =>
  BACKEND_FACTORIES[config.backend](config);
