import { expect } from '@playwright/test';

import { Then } from '../../fixtures/bddTest';
import { resolveWorldPath } from '../utils/resolveWorldPath';

Then('I am on {string}', async ({ page, world }, path: string) => {
  if (!page) {
    return;
  }

  const resolvedPath = resolveWorldPath({ path, world });
  const escapedPath = resolvedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await expect(page).toHaveURL(new RegExp(`${escapedPath}(\\?.*)?$`), {
    timeout: 15_000,
  });
});
