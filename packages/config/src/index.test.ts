import { afterEach, describe, expect, it, vi } from 'vitest';

describe('config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns development config when NODE_ENV is development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { config } = await import('./index.js');

    expect(config.apps.web.port).toBe(3000);
    expect(config.apps.docs.port).toBe(3001);
  });

  it('returns production config when NODE_ENV is production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { config } = await import('./index.js');

    expect(config.apps.web.port).toBe(3000);
    expect(config.apps.docs.port).toBe(3001);
  });

  it('falls back to development when NODE_ENV is undefined', async () => {
    vi.stubEnv('NODE_ENV', undefined);
    const { config } = await import('./index.js');

    expect(config.apps.web.port).toBe(3000);
    expect(config.apps.docs.port).toBe(3001);
  });

  it('falls back to development when NODE_ENV is invalid', async () => {
    vi.stubEnv('NODE_ENV', 'staging');
    const { config } = await import('./index.js');

    expect(config.apps.web.port).toBe(3000);
    expect(config.apps.docs.port).toBe(3001);
  });

  it('returns e2e config when VASSEMBLY_E2E is true', async () => {
    vi.stubEnv('VASSEMBLY_E2E', 'true');
    vi.stubEnv('NODE_ENV', 'development');
    const { config } = await import('./index.js');

    expect(config.apps.web.port).toBe(3001);
    expect(config.apps.docs.port).toBe(3002);
    expect(config.services.api.port).toBe(5001);
    expect(config.services.api.allowedOrigins).toEqual(['http://localhost:3001']);
  });

  it('prefers e2e config over production when VASSEMBLY_E2E is true', async () => {
    vi.stubEnv('VASSEMBLY_E2E', 'true');
    vi.stubEnv('NODE_ENV', 'production');
    const { config } = await import('./index.js');

    expect(config.apps.web.port).toBe(3001);
    expect(config.services.api.port).toBe(5001);
  });

  it('returns config with correct structure', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { config } = await import('./index.js');

    expect(config).toHaveProperty('apps');
    expect(config.apps).toHaveProperty('web');
    expect(config.apps).toHaveProperty('docs');
    expect(config.apps.web).toHaveProperty('port');
    expect(config.apps.docs).toHaveProperty('port');
  });
});
