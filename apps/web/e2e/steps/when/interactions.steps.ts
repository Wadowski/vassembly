import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

const { When } = createBdd(bddTest);

When('I click on the MCP {string}', async ({ page }, mcpName: string) => {
  if (!page) {
    return;
  }

  await page.getByRole('link', { name: `Configure ${mcpName}` }).click();
});
