import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  buildSystemMessageForSystemAgentInvoke,
  seedRuntimeSystemAgent,
  SKILL_CATALOG_SECTION_HEADING,
} from '../utils/skillRuntimeHelpers';
import { resolveSpecializationIdFromWorld } from '../utils/skillRuntimeContext';
import { normalizeSkillKey } from '../utils/seedSkill';
import type { WebBddWorld } from '../utils/types';

const { Then } = createBdd(bddTest);

const DETAIL_READY_TIMEOUT_MS = 15_000;

Then('I see the {string} button', async ({ page }, buttonName: string) => {
  if (!page) {
    return;
  }

  await expect(page.getByRole('button', { name: buttonName, exact: true })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('I see archive action for skill {string}', async ({ page }, skillName: string) => {
  if (!page) {
    return;
  }

  const skillsPanel = page.getByRole('region', { name: 'Skills' });
  await expect(skillsPanel.getByRole('button', { name: `Archive skill ${skillName}` })).toBeVisible({
    timeout: DETAIL_READY_TIMEOUT_MS,
  });
});

Then('there is no inline edit action on the skill item', async ({ page }) => {
  if (!page) {
    return;
  }

  const skillsPanel = page.getByRole('region', { name: 'Skills' });
  await expect(skillsPanel.getByRole('button', { name: /edit/i })).not.toBeVisible();
});

Then(
  'skill {string} is excluded from runtime catalog injection for specialization {string}',
  async ({ seed, world }, skillName: string, specializationName: string) => {
    const webWorld = world as WebBddWorld;
    const specializationId = resolveSpecializationIdFromWorld({
      world: webWorld,
      specializationName,
    });

    const systemAgentId = await seedRuntimeSystemAgent({
      context: seed,
      name: `Catalog probe ${specializationName}`,
      specializationId,
    });

    const systemMessage = await buildSystemMessageForSystemAgentInvoke({
      context: seed,
      systemAgentId,
    });

    if (systemMessage.includes(SKILL_CATALOG_SECTION_HEADING)) {
      expect(systemMessage).not.toContain(skillName);
      return;
    }

    expect(systemMessage).not.toContain(skillName);
  },
);

Then(
  'archived skill {string} is excluded from the query result',
  async ({ world }, skillName: string) => {
    const webWorld = world as WebBddWorld;
    const rawResult = webWorld.storedFields?.skillsBySpecializationResult;

    if (!rawResult) {
      throw new Error('skillsBySpecializationResult is required but not set on world.');
    }

    const names = JSON.parse(rawResult) as string[];
    expect(names.map((name) => normalizeSkillKey(name))).not.toContain(normalizeSkillKey(skillName));
  },
);
