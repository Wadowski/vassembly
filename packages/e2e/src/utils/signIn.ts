import { expect } from '@playwright/test';

const LOGIN_API_PATH = '/user/login';
const AUTH_READY_TIMEOUT_MS = 45_000;
const LOGIN_RESPONSE_TIMEOUT_MS = 20_000;

const hasStoredAuthTokens = (): boolean => {
  const authToken = window.localStorage.getItem('auth:token');
  const refreshToken = window.localStorage.getItem('auth:refreshToken');
  return authToken !== null && refreshToken !== null;
};

export interface SignInUserParams {
  page: NonNullable<import('@playwright/test').Page>;
  email: string;
  password: string;
}

export const signInUser = async ({ page, email, password }: SignInUserParams): Promise<void> => {
  await expect(async () => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);

    const loginResponse = page.waitForResponse(
      (response) =>
        response.url().includes(LOGIN_API_PATH) &&
        response.request().method() === 'POST' &&
        response.ok(),
      { timeout: LOGIN_RESPONSE_TIMEOUT_MS },
    );
    await page.getByRole('button', { name: 'Sign in' }).click();
    await loginResponse;
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 10_000 });
    await page.waitForFunction(hasStoredAuthTokens, undefined, { timeout: 10_000 });
  }).toPass({ timeout: AUTH_READY_TIMEOUT_MS });
};
