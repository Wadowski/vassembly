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

const getMonorepoRoot = () => path.resolve(__dirname, '../..');

const getE2eEnvironment = () => {
  const fileEnv = {
    ...loadEnvFile(path.join(getMonorepoRoot(), '.env')),
    ...loadEnvFile(path.join(getMonorepoRoot(), '.env.e2e')),
  };

  const readEnv = (key, fallback) => fileEnv[key] ?? process.env[key] ?? fallback;

  return {
    webPort: Number(readEnv('WEB_PORT', '3001')),
    apiPort: Number(readEnv('API_PORT', '5001')),
    docsPort: Number(readEnv('DOCS_PORT', '3002')),
    webBaseUrl: readEnv('E2E_WEB_BASE_URL', 'http://localhost:3001'),
    apiBaseUrl: readEnv('E2E_API_BASE_URL', 'http://localhost:5001'),
    mongoUrl: readEnv('MONGODB_URL', 'mongodb://user:pass@localhost:27017/?directConnection=true'),
    mongoDatabase: readEnv('MONGODB_DATABASE', 'vassembly_e2e'),
    jwtSecret: readEnv('JWT_SECRET', 'dev-jwt-secret'),
    encoderSecret: readEnv('ENCODER_SECRET', 'dev-encoder-secret'),
    nodeEnv: readEnv('NODE_ENV', 'development'),
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

  return defineConfig({
    testDir,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 4,
    _workerRstEveryNTests: 10,
    reporter: 'list',
    use: {
      baseURL: options.baseURL ?? environment.webBaseUrl,
      trace: 'on-first-retry',
      video: 'on-first-retry',
      screenshot: 'only-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    globalSetup: globalSetupPath,
    globalTeardown: globalTeardownPath,
  });
};

module.exports = { createE2ePlaywrightConfig };
