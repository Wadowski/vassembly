import { createBdd } from 'playwright-bdd';

import * as bddFixtures from '../../../../../packages/e2e/src/fixtures/bddTest';

const { bddTest } = bddFixtures;

const { When } = createBdd(bddTest);

When('I click on the MCP {string}', async ({ page }, mcpName: string) => {
  if (!page) {
    return;
  }

  await page.getByRole('link', { name: `Configure ${mcpName}` }).click();
});
