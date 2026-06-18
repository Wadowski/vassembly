const path = require('node:path');
const { createRequire } = require('node:module');

const nodeRequire = createRequire(path.resolve('package.json'));
const e2ePackageRoot = path.dirname(nodeRequire.resolve('../../packages/e2e/package.json'));
const { createE2ePlaywrightConfig } = require(path.join(
  e2ePackageRoot,
  'createE2ePlaywrightConfig.cjs',
));

module.exports = {
  ...createE2ePlaywrightConfig({
    appName: 'web',
    featuresDir: 'e2e/features',
    stepsDirs: [
      path.join(e2ePackageRoot, 'src/steps/given'),
      path.join(e2ePackageRoot, 'src/steps/when'),
      path.join(e2ePackageRoot, 'src/steps/then'),
      'e2e/steps/given',
      'e2e/steps/when',
      'e2e/steps/then',
      'e2e/steps/tasks',
      'e2e/steps/execution-progress',
    ],
    baseURL: process.env.E2E_WEB_BASE_URL ?? 'http://localhost:3001',
  }),
  timeout: 60_000,
  workers: 4,
};
