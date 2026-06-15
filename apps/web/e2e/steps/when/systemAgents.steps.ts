import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { resolveWorldPath } from '../utils/resolveWorldPath';
import { waitForSystemAgentFormReady } from '../utils/systemAgentsForm';
import type { WebBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

When('I open the system agent create form', async ({ page, world }) => {
  if (!page) {
    return;
  }

  await page.goto('/agents/system-agents/create', { waitUntil: 'domcontentloaded' });
  await waitForSystemAgentFormReady({ page, heading: /Create System Agent/i });
});

When('I open the system agent edit page', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const resolvedPath = resolveWorldPath({
    path: '/agents/system-agents/{systemAgentId}/edit',
    world: world as WebBddWorld,
  });
  await page.goto(resolvedPath, { waitUntil: 'domcontentloaded' });
  await waitForSystemAgentFormReady({ page, heading: /Edit System Agent/i });
});

When('I select {string} for system agent {string}', async ({ page }, optionLabel: string, fieldLabel: string) => {
  if (!page) {
    return;
  }

  const dropdownId =
    fieldLabel === 'Category' ? 'system-agent-category' : fieldLabel.toLowerCase().replace(/\s+/g, '-');
  await page.locator(`#${dropdownId}`).click();
  await page.getByRole('option', { name: optionLabel, exact: true }).click();
});
