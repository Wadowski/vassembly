import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { resolveWorldPath } from '../utils/resolveWorldPath';
import {
  getSpecializationCardLink,
  searchSpecializations,
  waitForSpecializationListing,
} from '../utils/specializationListing';
import type { WebBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

const normalizeSpecializationKey = (name: string): string => name.trim().toLowerCase();

When('I search specializations for {string}', async ({ page }, query: string) => {
  if (!page) {
    return;
  }

  await searchSpecializations({ page, query });
});

When('I click the specialization {string} in the list', async ({ page, world }, name: string) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const specializationId = webWorld.specializationIds?.[normalizeSpecializationKey(name)] ?? webWorld.specializationId;

  if (!specializationId) {
    throw new Error(`specializationId for "${name}" is required but not set on world.`);
  }

  webWorld.specializationId = specializationId;
  await waitForSpecializationListing({ page });
  await getSpecializationCardLink({ page, specializationName: name }).click();
  await page.waitForURL(new RegExp(`/specialization/${specializationId}$`), { timeout: 15_000 });
});

When('I navigate to the specialization detail page for {string}', async ({ page, world }, name: string) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const specializationId = webWorld.specializationIds?.[normalizeSpecializationKey(name)] ?? webWorld.specializationId;

  if (!specializationId) {
    throw new Error(`specializationId for "${name}" is required but not set on world.`);
  }

  webWorld.specializationId = specializationId;

  const resolvedPath = resolveWorldPath({
    path: '/specialization/{specializationId}',
    world: webWorld,
  });

  await page.goto(resolvedPath, { waitUntil: 'domcontentloaded' });
});
