import type { Page, Route } from '@playwright/test';

interface TestConnectionRequestBody {
  fieldValues?: Record<string, string | boolean>;
}

interface ConfigurationMutationResponse {
  id: string;
  userId: string;
  mcpId: string;
  status: string;
  fieldValues: [];
  createdAt: string;
  updatedAt: string;
}

const extractMcpId = (url: string): string => {
  const match = url.match(/\/mcps\/([^/]+)\/configuration/);
  return match?.[1] ?? 'unknown-mcp-id';
};

const buildConfigurationMutationResponse = ({ url }: { url: string }): ConfigurationMutationResponse => {
  const timestamp = new Date().toISOString();

  return {
    id: 'e2e-mcp-configuration-id',
    userId: 'e2e-user-id',
    mcpId: extractMcpId(url),
    status: 'configured',
    fieldValues: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

const fulfillTestConnection = async ({
  route,
  success,
  error,
}: {
  route: Route;
  success: boolean;
  error?: string;
}): Promise<void> => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success, error }),
  });
};

const handleBraveSearchTest = async ({
  route,
  fieldValues,
}: {
  route: Route;
  fieldValues: Record<string, string | boolean>;
}): Promise<boolean> => {
  const apiKey = fieldValues.apiKey;

  if (typeof apiKey !== 'string') {
    return false;
  }

  if (apiKey === 'invalid' || apiKey.length === 0) {
    await fulfillTestConnection({
      route,
      success: false,
      error: 'Invalid or missing API key',
    });
    return true;
  }

  await fulfillTestConnection({ route, success: true });
  return true;
};

const handleGmailTest = async ({
  route,
  fieldValues,
}: {
  route: Route;
  fieldValues: Record<string, string | boolean>;
}): Promise<boolean> => {
  const clientId = fieldValues.clientId;
  const clientSecret = fieldValues.clientSecret;

  if (clientId === 'valid-id' && typeof clientSecret === 'string' && clientSecret.length > 0) {
    await fulfillTestConnection({ route, success: true });
    return true;
  }

  if (clientId !== undefined) {
    await fulfillTestConnection({
      route,
      success: false,
      error: 'Invalid credentials',
    });
    return true;
  }

  return false;
};

const handleConfigurationMutation = async (route: Route): Promise<boolean> => {
  const method = route.request().method();
  const url = route.request().url();

  if (url.includes('/configuration/test')) {
    return false;
  }

  if (method === 'PATCH') {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildConfigurationMutationResponse({ url })),
    });
    return true;
  }

  return false;
};

export const setupMcpTestConnectionRoute = async ({ page }: { page: Page }): Promise<void> => {
  await page.route('**/mcps/*/configuration', async (route) => {
    if (await handleConfigurationMutation(route)) {
      return;
    }

    await route.continue();
  });

  await page.route('**/mcps/*/configuration/test', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const body = route.request().postDataJSON() as TestConnectionRequestBody | null;
    const fieldValues = body?.fieldValues ?? {};

    if (await handleBraveSearchTest({ route, fieldValues })) {
      return;
    }

    if (await handleGmailTest({ route, fieldValues })) {
      return;
    }

    await fulfillTestConnection({
      route,
      success: false,
      error: 'Invalid or missing API key',
    });
  });
};
