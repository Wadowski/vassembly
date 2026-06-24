import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import {
  seedManySpecializations,
  seedSpecialization,
  seedSpecializationWithRelations,
} from '../utils/seedSpecialization';
import { seedMcpCatalog } from '../utils/seedMcp';
import type { WebBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

const LEGAL_DESCRIPTION =
  'Covers legal research, contract drafting, and regulatory compliance.';
const FINANCE_DESCRIPTION = 'Financial analysis, budgeting, and reporting tasks.';

const normalizeSpecializationKey = (name: string): string => name.trim().toLowerCase();

const rememberSpecializationId = ({
  world,
  name,
  specializationId,
}: {
  world: WebBddWorld;
  name: string;
  specializationId: string;
}): void => {
  const key = normalizeSpecializationKey(name);
  world.specializationId = specializationId;
  world.specializationIds = {
    ...(world.specializationIds ?? {}),
    [key]: specializationId,
  };
};

const resolveDescriptionForName = (name: string): string => {
  const normalized = normalizeSpecializationKey(name);

  if (normalized === 'legal') {
    return LEGAL_DESCRIPTION;
  }

  if (normalized === 'finance') {
    return FINANCE_DESCRIPTION;
  }

  return `E2E specialization description for ${name}.`;
};

Given(
  'a specialization {string} exists with description {string}',
  async ({ seed, world }, name: string, description: string) => {
    const webWorld = world as WebBddWorld;
    const specializationId = await seedSpecialization({ context: seed, name, description });
    rememberSpecializationId({ world: webWorld, name, specializationId });
  },
);

Given(
  'a specialization {string} exists with {int} agents and {int} linked MCPs',
  async ({ seed, world }, name: string, agentCount: number, linkedMcpCount: number) => {
    const webWorld = world as WebBddWorld;
    await seedMcpCatalog({ context: seed });

    const specializationId = await seedSpecializationWithRelations({
      context: seed,
      name,
      description: resolveDescriptionForName(name),
      agentCount,
      linkedMcpCount,
    });

    rememberSpecializationId({ world: webWorld, name, specializationId });
  },
);

Given(
  'a specialization {string} exists with {int} provisioned agents and {int} missing agent slots',
  async ({ seed, world }, name: string, provisionedAgentCount: number, missingAgentSlots: number) => {
    const webWorld = world as WebBddWorld;
    const totalAgentSlots = provisionedAgentCount + missingAgentSlots;

    const specializationId = await seedSpecializationWithRelations({
      context: seed,
      name,
      description: resolveDescriptionForName(name),
      agentCount: totalAgentSlots === 0 ? 0 : provisionedAgentCount,
      linkedMcpCount: 0,
    });

    rememberSpecializationId({ world: webWorld, name, specializationId });
  },
);

Given('{int} specializations exist for list pagination', async ({ seed }, count: number) => {
  await seedManySpecializations({ context: seed, count });
});

Given('the specialization catalog is empty', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.route('**/graphql**', async (route) => {
    const postData = route.request().postData();

    if (postData?.includes('ListSpecializations')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            specializations: {
              items: [],
              total: 0,
              page: 0,
              size: 20,
            },
          },
        }),
      });
    }

    return route.continue();
  });
});
