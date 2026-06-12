const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { defineConfig, devices } = require('@playwright/test');
const { defineBddConfig } = require('playwright-bdd');

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  return env;
};

const getE2eEnvironment = () => {
  const e2eExampleEnv = loadEnvFile(path.join(process.cwd(), '.env.e2e.example'));
  return {
    webBaseUrl: e2eExampleEnv.E2E_WEB_BASE_URL ?? 'http://localhost:3000',
    apiBaseUrl: e2eExampleEnv.E2E_API_BASE_URL ?? 'http://localhost:5000',
    mongoUrl: e2eExampleEnv.MONGODB_URL ?? 'mongodb://user:pass@localhost:27017/?directConnection=true',
    mongoDatabase: e2eExampleEnv.MONGODB_DATABASE ?? 'vassembly_e2e',
    jwtSecret: e2eExampleEnv.JWT_SECRET ?? 'dev-jwt-secret',
    nodeEnv: e2eExampleEnv.NODE_ENV ?? 'development',
  };
};

const getE2ePackageRoot = () => {
  const nodeRequire = createRequire(path.resolve('package.json'));
  return path.dirname(nodeRequire.resolve('@vassembly/e2e/package.json'));
};

const createE2ePlaywrightConfig = (options) => {
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
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      MONGODB_URL: environment.mongoUrl,
      MONGODB_DATABASE: environment.mongoDatabase,
      JWT_SECRET: environment.jwtSecret,
      NODE_ENV: environment.nodeEnv,
    },
  }));

  return defineConfig({
    testDir,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 4 : undefined,
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

module.exports = { createE2ePlaywrightConfig };
