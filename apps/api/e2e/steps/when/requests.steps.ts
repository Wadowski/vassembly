import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { buildAuthHeaders, sendJsonRequest, storeApiResponse } from '../utils/requestUtils';
import type { ApiBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

When(
  'I send a POST request to {string} with JSON body:',
  async ({ request, world }, path: string, body: string) => {
    await sendJsonRequest({
      request,
      world: world as ApiBddWorld,
      method: 'POST',
      path,
      body,
    });
  },
);

When(
  'I send a {string} request to {string} with JSON body:',
  async ({ request, world }, method: string, path: string, body: string) => {
    await sendJsonRequest({
      request,
      world: world as ApiBddWorld,
      method,
      path,
      body,
    });
  },
);

When('I send a GraphQL query:', async ({ request, world }, query: string) => {
  const apiWorld = world as ApiBddWorld;
  const resolvedQuery = query.replace(/\{mcpId\}/g, apiWorld.mcpId ?? '');
  const response = await request.post(`${apiWorld.baseURL}/graphql`, {
    headers: buildAuthHeaders({ world: apiWorld }),
    data: { query: resolvedQuery },
  });

  await storeApiResponse({ response, world: apiWorld });
});
