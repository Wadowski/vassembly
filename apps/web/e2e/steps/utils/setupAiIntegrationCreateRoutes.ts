import type { Page } from '@playwright/test';

const TEST_CONNECTION_PATTERN = '**/ai-integrations/test-connection';
const CREATE_INTEGRATION_PATTERN = '**/ai-integrations';

export const setupAiIntegrationCreateRoutes = async ({ page }: { page: Page }): Promise<void> => {
  await page.route(TEST_CONNECTION_PATTERN, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route(CREATE_INTEGRATION_PATTERN, async (route) => {
    if (route.request().method() !== 'POST' || route.request().url().includes('test-connection')) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e2e-onboarding-ai-integration',
        name: 'E2E Onboarding Integration',
        provider: 'gemini',
        connectionStatus: 'connected',
      }),
    });
  });
};
