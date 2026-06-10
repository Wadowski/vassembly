require('tsx/cjs');

const { createE2ePlaywrightConfig } = require('../../packages/e2e/src/config/createE2ePlaywrightConfig.ts');

module.exports = createE2ePlaywrightConfig({
  appName: 'web',
  featuresDir: 'e2e/features',
  stepsDirs: [
    '../../packages/e2e/src/steps/given',
    '../../packages/e2e/src/steps/when',
    '../../packages/e2e/src/steps/then',
    'e2e/steps/given',
    'e2e/steps/when',
    'e2e/steps/then',
  ],
  baseURL: process.env.E2E_WEB_BASE_URL ?? 'http://localhost:3000',
  webServers: [
    {
      package: '@vassembly/api',
      url: 'http://localhost:5000/docs',
    },
    {
      package: '@vassembly/web',
      url: 'http://localhost:3000',
    },
  ],
});
