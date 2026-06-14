import { expect } from '@playwright/test';

import { dismissNavigationDrawer } from './settingsPage';

export const E2E_USER_PASSWORD = 'SecurePass123!';
const LOGIN_API_PATH = '/user/login';
const AUTH_READY_TIMEOUT_MS = 30_000;

const hasStoredAuthTokens = (): boolean => {
  const authToken = window.localStorage.getItem('auth:token');
  const refreshToken = window.localStorage.getItem('auth:refreshToken');
  return authToken !== null && refreshToken !== null;
};

export const signInSeededUser = async ({
  page,
  email,
}: {
  page: NonNullable<import('@playwright/test').Page>;
  email: string;
}): Promise<void> => {
  await expect(async () => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(E2E_USER_PASSWORD);

    const loginResponse = page.waitForResponse(
      (response) =>
        response.url().includes(LOGIN_API_PATH) &&
        response.request().method() === 'POST' &&
        response.ok(),
      { timeout: 15_000 },
    );
    await page.getByRole('button', { name: 'Sign in' }).click();
    await loginResponse;
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 5_000 });
    await page.waitForFunction(hasStoredAuthTokens, undefined, { timeout: 5_000 });
    await dismissNavigationDrawer({ page });
  }).toPass({ timeout: AUTH_READY_TIMEOUT_MS });
};

export const ensurePageAuthenticated = async ({
  page,
  email,
}: {
  page: NonNullable<import('@playwright/test').Page>;
  email: string;
}): Promise<void> => {
  const hasTokens = await page.evaluate(hasStoredAuthTokens);
  const onLoginPage = /\/login(?:\?|$)/.test(page.url());

  if (!hasTokens || onLoginPage) {
    await signInSeededUser({ page, email });
  }
};
