import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import type { PlaywrightTestConfig } from '@playwright/test';

import { getE2eEnvironment } from './environment';
import type { E2eConfigOptions } from './types';
import { getE2ePackageRoot } from '../steps/utils/packageRoot';

const getChromiumProjectUse = (): PlaywrightTestConfig['projects'] => {
  const isCi = Boolean(process.env.CI);

  return [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(isCi
          ? { launchOptions: { args: ['--disable-dev-shm-usage', '--disable-gpu'] } }
          : {}),
      },
    },
  ];
};

export const createE2ePlaywrightConfig = (options: E2eConfigOptions): PlaywrightTestConfig => {
  const packageRoot = getE2ePackageRoot();
  const environment = getE2eEnvironment();
  const bddTestPath = path.join(packageRoot, 'src/fixtures/bddTest.ts');
  const globalSetupPath = path.join(packageRoot, 'src/steps/utils/globalSetup.ts');
  const globalTeardownPath = path.join(packageRoot, 'src/steps/utils/globalTeardown.ts');
  const isCi = Boolean(process.env.CI);

  const testDir = defineBddConfig({
    features: [options.featuresDir],
    steps: [bddTestPath, ...options.stepsDirs],
  });

  return defineConfig({
    testDir,
    fullyParallel: true,
    forbidOnly: isCi,
    retries: isCi ? 1 : 0,
    workers: isCi ? 2 : undefined,
    reporter: 'list',
    use: {
      baseURL: options.baseURL ?? environment.webBaseUrl,
      trace: isCi ? 'retain-on-failure' : 'on-first-retry',
      video: isCi ? 'off' : 'on-first-retry',
      screenshot: 'only-on-failure',
    },
    projects: getChromiumProjectUse(),
    globalSetup: globalSetupPath,
    globalTeardown: globalTeardownPath,
  });
};
