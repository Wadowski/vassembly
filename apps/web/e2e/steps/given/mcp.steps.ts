import { createBdd } from 'playwright-bdd';

import { bddTest, getE2eEnvironment } from '@vassembly/e2e';

import { getMcpIdBySlug, seedMcpCatalog } from '../utils';
import { setupMcpTestConnectionRoute } from '../utils/setupMcpTestConnectionRoute';

const { Given } = createBdd(bddTest);

const BRAVE_SEARCH_FIELD_VALUES = {
  apiKey: 'e2e-test-api-key',
};

const buildAuthHeaders = ({
  token,
}: {
  token: string;
}): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

Given('the MCP catalog is seeded', async ({ page, seed }) => {
  await seedMcpCatalog({ context: seed });

  if (page) {
    await setupMcpTestConnectionRoute({ page });
  }
});

Given(
  'I have configured the MCP with slug {string}',
  async ({ request, seed, world }, slug: string) => {
    if (world.auth?.token === undefined) {
      throw new Error('User must be logged in before configuring an MCP');
    }

    await seedMcpCatalog({ context: seed });

    const mcpId = await getMcpIdBySlug({ context: seed, slug });
    const apiBaseUrl = getE2eEnvironment().apiBaseUrl;

    const response = await request.post(`${apiBaseUrl}/mcps/${mcpId}/configuration`, {
      headers: buildAuthHeaders({ token: world.auth.token }),
      data: { fieldValues: BRAVE_SEARCH_FIELD_VALUES },
    });

    if (response.status() === 409) {
      return;
    }

    if (response.status() !== 201) {
      const body = await response.text();
      throw new Error(`Failed to seed MCP configuration (${response.status()}): ${body}`);
    }
  },
);
