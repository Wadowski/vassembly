import { When } from '../../fixtures/bddTest';

When(
  'I send a {string} request to {string} with body',
  async ({ api, world }, method: string, apiPath: string, body: string) => {
    const url = new URL(apiPath, world.baseURL).toString();
    const response = await api.fetch(url, {
      method: method.toUpperCase(),
      headers: { 'Content-Type': 'application/json' },
      data: body,
    });

    world.lastResponse = response;
  },
);
