import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

const { Then } = createBdd(bddTest);

const DETAIL_READY_TIMEOUT_MS = 15_000;

Then('I see a {string} section', async ({ page }, sectionName: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('heading', { name: sectionName, exact: true, level: 2 })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see skill {string} with its description', async ({ page }, skillName: string) => {
  if (!page) {
    return;
  }

  const skillsPanel = page.getByRole('region', { name: 'Skills' });
  await expect(skillsPanel.getByText(skillName, { exact: true })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see the skill name {string}', async ({ page }, skillName: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('heading', { name: skillName, exact: true, level: 1 })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see the skill description', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('skill-detail-page')).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see the skill rule \\(instructions\\) content', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('skill-rule-content')).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see the rule content in a readable format', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('skill-rule-content')).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see the rule content', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('skill-rule-content')).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see script {string} in the scripts list', async ({ page }, filename: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('button', { name: filename, exact: true })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then("the first script's code is displayed by default", async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('skill-code-viewer')).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see the code content of {string}', async ({ page }, filename: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('button', { name: filename, exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(page.getByTestId('skill-code-viewer')).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then(
  'I do not see the code content of {string} as the active view',
  async ({ page }, filename: string) => {
    if (!page) {
      return;
    }

    await expect(page.getByRole('button', { name: filename, exact: true })).not.toHaveAttribute(
      'aria-current',
      'true',
    );
  },
);

Then('the code viewer applies Python syntax highlighting', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('skill-code-viewer')).toHaveAttribute('data-language', 'python', {
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('the code viewer applies JavaScript syntax highlighting', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('skill-code-viewer')).toHaveAttribute('data-language', 'javascript', {
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('the code viewer applies Bash\\/shell syntax highlighting', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByTestId('skill-code-viewer')).toHaveAttribute('data-language', 'bash', {
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see a link back to the parent specialization detail page', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('link', { name: 'Back to specialization' })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('there is no {string} button', async ({ page }, buttonName: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('button', { name: buttonName, exact: true })).not.toBeVisible();
});

Then('I see an {string} button for skill {string}', async ({ page }, buttonName, skillName) => {
  if (!page) {
    return;
  }

  const skillsPanel = page.getByRole('region', { name: 'Skills' });
  const skillRow = skillsPanel.locator('[data-enabled]').filter({ hasText: skillName });
  const resolvedButtonName =
    buttonName === 'Archive' ? `Archive skill ${skillName}` : buttonName;
  await expect(skillRow.getByRole('button', { name: resolvedButtonName, exact: true })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('skill {string} no longer appears in the active skills list', async ({ page }, skillName) => {
  if (!page) {
    return;
  }

  const skillsPanel = page.getByRole('region', { name: 'Skills' });
  await expect(skillsPanel.getByText(skillName, { exact: true })).not.toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('archived skills are excluded by default', async ({ world }) => {
  const webWorld = world as import('../utils/types').WebBddWorld;
  const items = webWorld.storedFields?.activeSkillsQueryResult;

  if (!Array.isArray(items)) {
    throw new Error('activeSkillsQueryResult must be set on world.');
  }

  const hasArchivedSkill = items.some((item) => {
    const name = typeof item.name === 'string' ? item.name : '';
    return name === 'contract-review';
  });

  expect(hasArchivedSkill).toBe(false);
});

Then('there is no edit or delete action on any skill item', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible();
  await expect(page.getByRole('button', { name: /delete/i })).not.toBeVisible();
});

Then('I see the admin-only access message', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(
    page.getByText('Specialization management is available to administrators only.', { exact: true }),
  ).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I am on a specialization detail page or skill detail page', async ({ page }) => {
  if (!page) {
    return;
  }

  const detailPage = page.getByTestId('specialization-detail-page');
  const skillPage = page.getByTestId('skill-detail-page');

  await expect(detailPage.or(skillPage)).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I am on the skill detail page for {string}', async ({ page, world }, skillName: string) => {
  if (!page) {
    return;
  }

  const webWorld = world as import('../utils/types').WebBddWorld;
  const skillKey = skillName.trim().toLowerCase();
  const skillId = webWorld.skillIds?.[skillKey] ?? webWorld.skillId;

  if (!skillId || !webWorld.specializationId) {
    throw new Error(`skill and specialization context for "${skillName}" must be set on world.`);
  }

  await expect(page).toHaveURL(
    new RegExp(`/specialization/${webWorld.specializationId}/skills/${skillId}$`),
    { timeout: DETAIL_READY_TIMEOUT_MS },
  );
  await expect(page.getByTestId('skill-detail-page')).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});
