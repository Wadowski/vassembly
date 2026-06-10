import { When } from '../../fixtures/bddTest';

When('I navigate to {string}', async ({ page }, path: string) => {
  if (!page) {
    return;
  }

  await page.goto(path);
});
