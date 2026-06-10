import { test as base, createBdd } from 'playwright-bdd';
import type { APIRequestContext } from '@playwright/test';

import { getE2eEnvironment } from '../config/environment';
import type { AuthContext, BddWorld, SeedContext } from './types';

interface BddFixtures {
  world: BddWorld;
  api: APIRequestContext;
  auth: AuthContext | null;
  seed: SeedContext;
}

const bddTest = base.extend<BddFixtures>({
  world: async ({ page, request, baseURL }, use) => {
    const world: BddWorld = {
      page,
      request,
      baseURL: baseURL ?? getE2eEnvironment().webBaseUrl,
      auth: null,
    };
    await use(world);
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
