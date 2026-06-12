import type { Page } from '@playwright/test';
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

const resolveAuthToken = async ({
  page,
  fallbackToken,
}: {
  page?: Page;
  fallbackToken?: string;
}): Promise<string> => {
  if (page !== undefined) {
    const browserToken = await page.evaluate(() => localStorage.getItem('auth:token'));
    if (browserToken !== null && browserToken !== '') {
      return browserToken;
    }
  }

  if (fallbackToken !== undefined && fallbackToken !== '') {
    return fallbackToken;
  }

  throw new Error('No auth token available for MCP configuration seeding');
};

Given('the MCP catalog is seeded', async ({ page, seed }) => {
  await seedMcpCatalog({ context: seed });

  if (page) {
    await setupMcpTestConnectionRoute({ page });
  }
});

Given(
  'I have configured the MCP with slug {string}',
  async ({ page, request, seed, world }, slug: string) => {
    if (world.auth === null || world.auth === undefined) {
      throw new Error('User must be logged in before configuring an MCP');
    }

    await seedMcpCatalog({ context: seed });

    const mcpId = await getMcpIdBySlug({ context: seed, slug });
    const apiBaseUrl = getE2eEnvironment().apiBaseUrl;
    const token = await resolveAuthToken({ page, fallbackToken: world.auth.token });
    const headers = buildAuthHeaders({ token });
    const configurationUrl = `${apiBaseUrl}/mcps/${mcpId}/configuration`;

    await request.delete(configurationUrl, { headers });

    const response = await request.post(configurationUrl, {
      headers,
      data: { fieldValues: BRAVE_SEARCH_FIELD_VALUES },
    });

    if (response.status() !== 201) {
      const body = await response.text();
      throw new Error(`Failed to seed MCP configuration (${response.status()}): ${body}`);
    }
  },
);
