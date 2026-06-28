import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { CURRENT_DATE_TIME_SECTION_HEADING } from '@vassembly/constants';
import { bddTest } from '@vassembly/e2e';

import { SKILL_CATALOG_SECTION_HEADING } from '../utils/skillRuntimeHelpers';
import {
  openInternalToolPicker,
} from '../utils/agentInternalToolsPicker';
import { waitForSystemAgentFormReady } from '../utils/systemAgentsForm';
import type { WebBddWorld } from '../utils/types';

const { Then } = createBdd(bddTest);

const getSystemMessage = (world: WebBddWorld): string => {
  const systemMessage = world.storedFields?.systemMessage;
  if (!systemMessage) {
    throw new Error('systemMessage is required but not set on world.');
  }

  return systemMessage;
};

Then('the system message includes a skill catalog section', async ({ world }) => {
  const systemMessage = getSystemMessage(world as WebBddWorld);
  expect(systemMessage).toContain(SKILL_CATALOG_SECTION_HEADING);
});

Then('each catalog entry shows name and description only with no rule body', async ({ world }) => {
  const webWorld = world as WebBddWorld;
  const systemMessage = getSystemMessage(webWorld);

  expect(systemMessage).toContain('contract-review');
  expect(systemMessage).toContain('Validate contract clauses against policy requirements.');
  expect(systemMessage).not.toContain('Review each contract clause for compliance risks.');
});

Then('disabled and archived skills are omitted from the skill catalog', async ({ world }) => {
  const systemMessage = getSystemMessage(world as WebBddWorld);

  expect(systemMessage).not.toContain('deprecated-review');
  expect(systemMessage).not.toContain('old-research');
});

Then("the system message contains only the agent's base rule", async ({ world }) => {
  const webWorld = world as WebBddWorld;
  const systemMessage = getSystemMessage(webWorld);
  const agentName = webWorld.storedFields?.lastInvokedAgentName ?? 'Assistant';
  const baseRule = webWorld.storedFields?.[`baseRule:${agentName.trim().toLowerCase()}`];

  if (!baseRule) {
    throw new Error(`base rule for "${agentName}" is required but not set on world.`);
  }

  expect(systemMessage.startsWith(baseRule)).toBe(true);
  expect(systemMessage).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
});

Then('no skill catalog section is appended', async ({ world }) => {
  const systemMessage = getSystemMessage(world as WebBddWorld);
  expect(systemMessage).not.toContain(SKILL_CATALOG_SECTION_HEADING);
});

Then('no skill catalog is injected', async ({ world }) => {
  const systemMessage = getSystemMessage(world as WebBddWorld);
  expect(systemMessage).not.toContain(SKILL_CATALOG_SECTION_HEADING);
});

Then('the tool returns the full rule Markdown body for {string}', async ({ world }, skillName: string) => {
  const webWorld = world as WebBddWorld;
  const result = webWorld.storedFields?.resolveSkillResult;

  if (!result) {
    const resolveSkillError = webWorld.storedFields?.resolveSkillError;
    throw new Error(
      resolveSkillError
        ? `resolveSkillResult is missing because skill-resolve failed: ${resolveSkillError}`
        : 'resolveSkillResult is required but not set on world.',
    );
  }

  const parsed = JSON.parse(result) as { skillName?: string; rule?: string };
  expect(parsed.skillName).toBe(skillName);
  expect(parsed.rule).toContain('Review each contract clause for compliance risks.');
});

Then('resolve_skill returns a not-found error', async ({ world }) => {
  const webWorld = world as WebBddWorld;
  const errorMessage = webWorld.storedFields?.resolveSkillError;

  expect(errorMessage).toBeTruthy();
  expect(errorMessage?.toLowerCase()).toMatch(/not found|not active/);
});

Then('the use_agent result includes the full rule for {string}', async ({ world }, skillName: string) => {
  const webWorld = world as WebBddWorld;
  const result = webWorld.storedFields?.useAgentResult;

  expect(result).toBeTruthy();
  expect(String(result)).toContain('Review each contract clause for compliance risks.');
  expect(webWorld.storedFields?.lastResolvedSkillName).toBe(skillName);
});

Then(
  'internal tool {string} is available on the system agent form',
  async ({ page }, toolName: string) => {
    if (!page) {
      return;
    }

    await waitForSystemAgentFormReady({ page, heading: /Edit System Agent/i });

    const assignedTool = page.getByText(new RegExp(toolName, 'i'));
    if (await assignedTool.isVisible()) {
      return;
    }

    const listbox = await openInternalToolPicker({ page });
    await expect(listbox.getByRole('option', { name: new RegExp(`^${toolName}$`, 'i') })).toBeVisible();
    await page.keyboard.press('Escape');
  },
);

Then(
  'internal tool {string} is assigned on the system agent form',
  async ({ page }, toolName: string) => {
    if (!page) {
      return;
    }

    await waitForSystemAgentFormReady({ page, heading: /Edit System Agent/i });
    await expect(page.getByText(new RegExp(toolName, 'i'))).toBeVisible();
  },
);

Then(
  'internal tool {string} is not assigned on the system agent form',
  async ({ page }, toolName: string) => {
    if (!page) {
      return;
    }

    await waitForSystemAgentFormReady({ page, heading: /Edit System Agent/i });
    const section = page
      .locator('div')
      .filter({ has: page.getByText('Internal tools', { exact: true }) })
      .last();
    await expect(section.getByText(new RegExp(toolName, 'i'))).not.toBeVisible();
  },
);
