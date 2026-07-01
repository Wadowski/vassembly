import { expect } from '@playwright/test';

import { dismissNavigationDrawer } from './settingsPage';

export const E2E_USER_PASSWORD = 'SecurePass123!';
const LOGIN_API_PATH = '/user/login';
const AUTH_TOKEN_STORAGE_KEY = 'auth:token';
const AUTH_READY_TIMEOUT_MS = 45_000;
const LOGIN_RESPONSE_TIMEOUT_MS = 20_000;

export const getSessionAuthToken = async ({
  page,
}: {
  page: NonNullable<import('@playwright/test').Page>;
}): Promise<string> => {
  const token = await page.evaluate(
    (storageKey) => window.localStorage.getItem(storageKey),
    AUTH_TOKEN_STORAGE_KEY,
  );

  if (!token) {
    throw new Error('Auth token not found in browser session');
  }

  return token;
};

const hasStoredAuthTokens = (): boolean => {
  const authToken = window.localStorage.getItem('auth:token');
  const refreshToken = window.localStorage.getItem('auth:refreshToken');
  return authToken !== null && refreshToken !== null;
};

export const clearBrowserSession = async ({
  page,
}: {
  page: NonNullable<import('@playwright/test').Page>;
}): Promise<void> => {
  await page.goto('/login');
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
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
      { timeout: LOGIN_RESPONSE_TIMEOUT_MS },
    );
    await page.getByLabel('Password').press('Enter');
    await loginResponse;
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10_000 });
    await page.waitForFunction(hasStoredAuthTokens, undefined, { timeout: 10_000 });
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
