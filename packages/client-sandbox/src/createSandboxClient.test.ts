import { describe, expect, it } from 'vitest';

import { createSandboxClient } from './createSandboxClient';

import type { ExecutionConfig } from '@vassembly/config';

const baseConfig: ExecutionConfig = {
  backend: 'local',
  stdoutMaxBytes: 262_144,
  stderrMaxBytes: 65_536,
  memoryLimitMb: 256,
  local: { workerUrl: 'http://localhost:4010' },
  cloud: { workerUrl: 'https://sandbox.example', apiKey: 'key', warmPoolSize: 2 },
};

describe('createSandboxClient', () => {
  it('should return local strategy when backend is local', () => {
    const strategy = createSandboxClient({ ...baseConfig, backend: 'local' });

    expect(typeof strategy.execute).toBe('function');
    expect(typeof strategy.deleteWorkspace).toBe('function');
  });

  it('should return cloud strategy when backend is cloud', () => {
    const strategy = createSandboxClient({ ...baseConfig, backend: 'cloud' });

    expect(typeof strategy.execute).toBe('function');
    expect(typeof strategy.deleteWorkspace).toBe('function');
  });
});
