import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import type { PlaywrightTestConfig } from '@playwright/test';

import { getE2eEnvironment } from './environment';
import type { E2eConfigOptions } from './types';
import { getE2ePackageRoot } from '../steps/utils/packageRoot';

export const createE2ePlaywrightConfig = (options: E2eConfigOptions): PlaywrightTestConfig => {
  const packageRoot = getE2ePackageRoot();
  const environment = getE2eEnvironment();
  const bddTestPath = path.join(packageRoot, 'src/fixtures/bddTest.ts');
  const globalSetupPath = path.join(packageRoot, 'src/steps/utils/globalSetup.ts');
  const globalTeardownPath = path.join(packageRoot, 'src/steps/utils/globalTeardown.ts');

  const testDir = defineBddConfig({
    features: [options.featuresDir],
    steps: [bddTestPath, ...options.stepsDirs],
  });

  const webServers = options.webServers?.map((server) => ({
    command: `pnpm --filter ${server.package} dev`,
    url: server.url,
    reuseExistingServer: !process.env.CI || process.env.E2E_REUSE_SERVERS === 'true',
    timeout: 120_000,
  }));

  return defineConfig({
    testDir,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'list',
    use: {
      baseURL: options.baseURL ?? environment.webBaseUrl,
      trace: 'on-first-retry',
    },
    webServer: webServers,
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    globalSetup: globalSetupPath,
    globalTeardown: globalTeardownPath,
  });
};
