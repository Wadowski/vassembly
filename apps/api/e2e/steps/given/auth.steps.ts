import { createBdd } from 'playwright-bdd';

import { bddTest, seedUser } from '@vassembly/e2e';

import { seedMcp } from '../utils/seedMcp';
import type { ApiBddWorld } from '../utils/types';

const { Given } = createBdd(bddTest);

const E2E_USER_EMAIL = 'e2e-api@vassembly.test';
const E2E_USER_PASSWORD = 'SecurePass123!';

Given('I am logged in', async ({ seed, world }) => {
  const user = await seedUser({
    email: E2E_USER_EMAIL,
    password: E2E_USER_PASSWORD,
    context: seed,
  });

  (world as ApiBddWorld).auth = {
    userId: user.id,
    token: user.token,
    email: user.email,
  };
});

Given('an MCP exists with name {string}', async ({ seed, world }, name: string) => {
  const mcpId = await seedMcp({
    context: seed,
    name,
    provider: 'Anthropic',
    description: 'E2E MCP',
  });

  (world as ApiBddWorld).mcpId = mcpId;
});

Given(
  'an MCP exists with name {string} and type {string}',
  async ({ seed, world }, name: string, type: string) => {
    const mcpId = await seedMcp({
      context: seed,
      name,
      provider: type,
      description: 'E2E MCP',
    });

    (world as ApiBddWorld).mcpId = mcpId;
  },
);
