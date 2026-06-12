import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { bddTest, getE2eEnvironment } from '@vassembly/e2e';

import { resolveMcpFormFieldLabel } from '../utils/resolveMcpFormFieldLabel';

const { When, Then } = createBdd(bddTest);

const MCP_DETAIL_TIMEOUT_MS = 15_000;

const waitForMcpDetail = async ({ page }: { page: NonNullable<import('@playwright/test').Page> }): Promise<void> => {
  await page.getByTestId('mcp-detail-mobile-layout').waitFor({ timeout: MCP_DETAIL_TIMEOUT_MS });
};

When('I fill the MCP form field {string} with {string}', async ({ page }, fieldName: string, value: string) => {
  if (!page) {
    return;
  }

  await waitForMcpDetail({ page });

  const fieldLabel = resolveMcpFormFieldLabel(fieldName);
  const fieldInput = page.getByLabel(fieldLabel, { exact: false });
  await fieldInput.fill(value);
  await fieldInput.blur();
});

When('I click the Test Connection button', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForMcpDetail({ page });

  const testResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/configuration/test') && response.request().method() === 'POST',
    { timeout: 15_000 },
  );

  await page.getByRole('button', { name: /Test Connection/i }).click();
  await testResponse;
});

When('I click the Save Configuration button', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForMcpDetail({ page });

  const saveButton = page.getByRole('button', { name: /Save Configuration/i });
  await expect(saveButton).toBeEnabled({ timeout: 15_000 });
  await saveButton.click();
});

When('I click the Remove Configuration button', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForMcpDetail({ page });
  await page.getByRole('button', { name: /Remove Configuration/i }).click();
  await page.getByRole('dialog', { name: /Delete this configuration/i }).waitFor({ timeout: 5_000 });
});

When('I confirm the remove modal', async ({ page }) => {
  if (!page) {
    return;
  }

  const dialog = page.getByRole('dialog', { name: /Delete this configuration/i });
  const deleteResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/configuration') &&
      !response.url().includes('/configuration/test') &&
      response.request().method() === 'DELETE',
    { timeout: 15_000 },
  );

  await dialog.getByRole('button', { name: /^Confirm$/i }).click();
  const response = await deleteResponse;
  const responseBody = await response.text();
  expect(response.ok(), `DELETE ${response.status()}: ${responseBody}`).toBe(true);
});

When('I select {string} in the {string} field', async ({ page }, optionLabel: string, fieldName: string) => {
  if (!page) {
    return;
  }

  await waitForMcpDetail({ page });

  const resolvedLabel = resolveMcpFormFieldLabel(fieldName);
  await page.getByLabel(resolvedLabel, { exact: false }).selectOption({ label: optionLabel });
  await page.waitForTimeout(200);
});

When('I check the {string} checkbox', async ({ page }, checkboxLabel: string) => {
  if (!page) {
    return;
  }

  await waitForMcpDetail({ page });

  const checkbox = page.getByRole('checkbox', {
    name: resolveMcpFormFieldLabel(checkboxLabel),
    exact: false,
  });
  if (!(await checkbox.isChecked())) {
    await checkbox.click();
  }
  await checkbox.blur();
});

When('I click the Test Connection button when network is unavailable', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.unroute('**/mcps/*/configuration/test');
  await page.context().setOffline(true);

  await waitForMcpDetail({ page });
  await page.getByRole('button', { name: /Test Connection/i }).click();

  await page.waitForTimeout(500);

  await page.context().setOffline(false);
});

When('I click the Save Configuration button without testing', async ({ page }) => {
  if (!page) {
    return;
  }

  await waitForMcpDetail({ page });

  const saveButton = page.getByRole('button', { name: /Save Configuration/i });
  if (await saveButton.isEnabled()) {
    await saveButton.click();
  }
});

When('the session expires before save', async ({ page, world }) => {
  if (!page || !world.auth) {
    return;
  }

  world.auth.token = '';
  await page.unroute('**/mcps/*/configuration');
  await page.unroute('**/mcps/*/configuration/test');
  await page.evaluate(() => {
    localStorage.removeItem('auth:token');
    localStorage.removeItem('auth:refreshToken');
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  });
});

When('the server fails on configuration save', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.route('**/mcps/*/configuration', (route) => {
    if (route.request().method() === 'GET') {
      void route.continue();
      return;
    }

    void route.abort('failed');
  });
});

Then('I see the configuration form for {string}', async ({ page }, mcpName: string) => {
  if (!page) {
    return;
  }

  await waitForMcpDetail({ page });

  const testButton = page.getByRole('button', { name: /Test Connection/i });
  await expect(testButton).toBeVisible();
});

Then('the Test Connection button shows success', async ({ page }) => {
  if (!page) {
    return;
  }

  const successIndicator = page.getByTestId('connection-success-indicator');
  await expect(successIndicator).toBeVisible({ timeout: 5000 });
});

Then('I see "Connection verified" on the form', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByText(/Connection verified/i)).toBeVisible();
});

Then('I am redirected to the MCP list', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page).toHaveURL(/\/mcps(?:\?|$)/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: /MCPs/i, level: 1 })).toBeVisible({ timeout: 15_000 });
});

Then('I am redirected to the login page', async ({ page }) => {
  if (!page) {
    return;
  }

  await expect(page.getByLabel(/Email/i)).toBeVisible({ timeout: 5000 });
});

Then('the form shows error for {string} field', async ({ page }, fieldName: string) => {
  if (!page) {
    return;
  }

  const detailPage = page.getByTestId('mcp-detail-mobile-layout');
  const formAlert = detailPage.getByRole('alert');
  await expect(formAlert).toBeVisible({ timeout: 10_000 });
});

Then('the Test Connection button is disabled', async ({ page }) => {
  if (!page) {
    return;
  }

  const testButton = page.getByRole('button', { name: /Test Connection/i });
  await expect(testButton).toBeDisabled();
});

Then('the Save Configuration button is disabled', async ({ page }) => {
  if (!page) {
    return;
  }

  const saveButton = page.getByRole('button', { name: /Save Configuration/i });
  await expect(saveButton).toBeDisabled();
});

Then('I see a warning modal asking to test connection first', async ({ page }) => {
  if (!page) {
    return;
  }

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 3000 });
  await expect(modal.getByText(/[Tt]est.*[Cc]onnection/i)).toBeVisible();
});

Then('I see network error message on the form', async ({ page }) => {
  if (!page) {
    return;
  }

  const detailPage = page.getByTestId('mcp-detail-mobile-layout');
  const alert = detailPage.getByRole('alert');
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(alert).toContainText(/network|connection|offline|server|unable to reach/i);
});

Then('I see a Retry button', async ({ page }) => {
  if (!page) {
    return;
  }

  const retryButton = page.getByRole('button', { name: /Retry/i });
  await expect(retryButton).toBeVisible();
});

Then('I see error snackbar message', async ({ page }) => {
  if (!page) {
    return;
  }

  const detailPage = page.getByTestId('mcp-detail-mobile-layout');
  const formError = detailPage.getByRole('alert');
  await expect(formError).toBeVisible({ timeout: 5_000 });
});

Then('the form still shows {string} in the apiKey field', async ({ page }, fieldValue: string) => {
  if (!page) {
    return;
  }

  const fieldInput = page.getByLabel(resolveMcpFormFieldLabel('apiKey'), { exact: false });
  await expect(fieldInput).toHaveValue(fieldValue);
});

Then('the form still shows {string} in the {string} field', async ({ page }, fieldValue: string, fieldName: string) => {
  if (!page) {
    return;
  }

  const fieldInput = page.getByLabel(resolveMcpFormFieldLabel(fieldName), { exact: false });
  await expect(fieldInput).toHaveValue(fieldValue);
});
