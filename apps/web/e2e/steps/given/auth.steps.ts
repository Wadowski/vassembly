import { createBdd } from 'playwright-bdd';

import * as bddFixtures from '../../../../../packages/e2e/src/fixtures/bddTest';
import * as seedUserModule from '../../../../../packages/e2e/src/seed/seedUser';

import { seedMcp, seedMcpCatalog } from '../utils/seedMcp';
import type { McpCatalogEntry } from '../utils/types';

const { bddTest } = bddFixtures;
const { seedUser } = seedUserModule;

const { Given } = createBdd(bddTest);

const E2E_USER_EMAIL = 'e2e@vassembly.test';
const E2E_USER_PASSWORD = 'Password123';

Given('I am logged in', async ({ page, seed, world }) => {
  const user = await seedUser({
    email: E2E_USER_EMAIL,
    password: E2E_USER_PASSWORD,
    context: seed,
  });

  if (!page) {
    return;
  }

  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(E2E_USER_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  world.auth = {
    userId: user.id,
    token: user.token,
    email: user.email,
  };
});

Given(
  'an MCP catalog exists with the following entries:',
  async ({ seed }, table) => {
    const rows = table.rows();
    const entries: McpCatalogEntry[] = [];

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const name = row[0];
      const provider = row[1];
      const description = row[2];

      if (!name || !provider || !description) {
        continue;
      }

      entries.push({ name, provider, description });
    }

    await seedMcpCatalog({ context: seed, entries });
  },
);

Given('an MCP exists with name {string}', async ({ seed }, name: string) => {
  await seedMcp({
    context: seed,
    name,
    provider: 'Anthropic',
    description: 'Most capable model',
  });
});
