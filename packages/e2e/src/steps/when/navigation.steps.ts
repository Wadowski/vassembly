import { When } from '../../fixtures/bddTest';
import { resolveWorldPath } from '../utils/resolveWorldPath';

When('I navigate to {string}', async ({ page, world }, path: string) => {
  if (!page) {
    return;
  }

  const resolvedPath = resolveWorldPath({ path, world });
  await page.goto(resolvedPath);
});
