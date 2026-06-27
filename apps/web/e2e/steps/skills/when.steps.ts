import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { resolveWorldPath } from '../utils/resolveWorldPath';
import { normalizeSkillKey } from '../utils/seedSkill';
import { queryActiveSkillsBySpecialization } from '../utils/skillStateHelpers';
import type { WebBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

When('I click the skill {string}', async ({ page, world }, skillName: string) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const skillKey = normalizeSkillKey(skillName);
  const skillId = webWorld.skillIds?.[skillKey] ?? webWorld.skillId;

  if (!skillId) {
    throw new Error(`skillId for "${skillName}" is required but not set on world.`);
  }

  webWorld.skillId = skillId;

  await page.getByRole('link', { name: `View skill ${skillName}` }).click();
});

When('I navigate to the skill detail page for {string}', async ({ page, world }, skillName: string) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const skillKey = normalizeSkillKey(skillName);
  const skillId = webWorld.skillIds?.[skillKey] ?? webWorld.skillId;

  if (!skillId) {
    throw new Error(`skillId for "${skillName}" is required but not set on world.`);
  }

  if (!webWorld.specializationId) {
    throw new Error('specializationId is required but not set on world.');
  }

  webWorld.skillId = skillId;

  const resolvedPath = resolveWorldPath({
    path: '/specialization/{specializationId}/skills/{skillId}',
    world: webWorld,
  });

  await page.goto(resolvedPath, { waitUntil: 'domcontentloaded' });
});

When(
  'I archive the skill {string} from the admin UI',
  async ({ page }, skillName: string) => {
    if (!page) {
      return;
    }

    const skillsPanel = page.getByRole('region', { name: 'Skills' });
    const skillRow = skillsPanel.locator('[data-enabled]').filter({ hasText: skillName });
    await skillRow.getByRole('button', { name: `Archive skill ${skillName}` }).click();
    await page.getByRole('button', { name: 'Archive skill', exact: true }).click();
  },
);

When(
  'skillsBySpecialization is queried for specialization {string}',
  async ({ seed, world }, specializationName: string) => {
    const webWorld = world as WebBddWorld;
    const specializationKey = specializationName.trim().toLowerCase();
    const specializationId =
      webWorld.specializationIds?.[specializationKey] ?? webWorld.specializationId;

    if (!specializationId) {
      throw new Error(`specializationId for "${specializationName}" is required on world.`);
    }

    const items = await queryActiveSkillsBySpecialization({
      context: seed,
      specializationId,
    });

    webWorld.storedFields = {
      ...(webWorld.storedFields ?? {}),
      activeSkillsQueryResult: items,
    };
  },
);

When('I select script {string}', async ({ page }, filename: string) => {
  if (!page) {
    return;
  }

  await page.getByRole('button', { name: filename, exact: true }).click();
});

When('I view that script on the skill detail page', async ({ page, world }) => {
  if (!page) {
    return;
  }

  const webWorld = world as WebBddWorld;
  const skillName = webWorld.storedFields?.activeSkillName;

  if (!skillName || !webWorld.specializationId) {
    throw new Error('activeSkillName and specializationId are required on world.');
  }

  const skillKey = normalizeSkillKey(skillName);
  const skillId = webWorld.skillIds?.[skillKey] ?? webWorld.skillId;

  if (!skillId) {
    throw new Error(`skillId for "${skillName}" is required but not set on world.`);
  }

  webWorld.skillId = skillId;

  const resolvedPath = resolveWorldPath({
    path: '/specialization/{specializationId}/skills/{skillId}',
    world: webWorld,
  });

  await page.goto(resolvedPath, { waitUntil: 'domcontentloaded' });
});
