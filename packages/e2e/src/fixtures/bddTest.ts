import { test as base, createBdd } from 'playwright-bdd';
import type { APIRequestContext } from '@playwright/test';

import { getE2eEnvironment } from '../config/environment';
import { ConsoleErrorDetector, DiagnosticsReporter, RequestLoopDetector } from '../steps/utils/diagnostics';
import type { AuthContext, BddWorld, SeedContext } from './types';

interface BddFixtures {
  world: BddWorld;
  api: APIRequestContext;
  auth: AuthContext | null;
  seed: SeedContext;
}

const bddTest = base.extend<BddFixtures>({
  world: async ({ page, request, baseURL }, use) => {
    const environment = getE2eEnvironment();
    const world: BddWorld = {
      page,
      request,
      baseURL: baseURL ?? environment.webBaseUrl,
      auth: null,
      diagnostics: {
        consoleMessages: [],
        requests: [],
        requestCountByUrl: new Map(),
        requestCountByOperation: new Map(),
      },
    };

    if (environment.enableDiagnostics && page) {
      const consoleDetector = new ConsoleErrorDetector();
      const requestDetector = new RequestLoopDetector();

      consoleDetector.attachListener(page);
      requestDetector.attachListener(page);

      world.diagnostics!.consoleMessages = consoleDetector.messages;
      world.diagnostics!.requests = requestDetector.requests;
      world.diagnostics!.requestCountByUrl = requestDetector.requestCountByUrl;
      world.diagnostics!.requestCountByOperation = requestDetector.requestCountByOperation;
    }

    await use(world);

    if (environment.enableDiagnostics && !world.skipDiagnosticAssertions) {
      DiagnosticsReporter.assertNoDiagnosticErrors(world, environment);
    }
  },
  api: async ({ request }, use) => {
    await use(request);
  },
  auth: async ({ world }, use) => {
    world.auth = null;
    await use(world.auth);
  },
  seed: async ({}, use) => {
    const environment = getE2eEnvironment();
    await use({
      mongoUrl: environment.mongoUrl,
      mongoDatabase: environment.mongoDatabase,
    });
  },
});

export const test = bddTest;
export { bddTest };
export const { Given, When, Then } = createBdd(bddTest);
