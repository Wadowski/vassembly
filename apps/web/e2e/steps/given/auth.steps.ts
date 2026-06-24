import { randomUUID } from 'node:crypto';

import { createBdd } from 'playwright-bdd';

import { bddTest, seedUser } from '@vassembly/e2e';

import { E2E_USER_PASSWORD, clearBrowserSession, signInSeededUser } from '../utils/auth';
import { promoteUserToAdmin } from '../utils/promoteUserToAdmin';

const { Given, When } = createBdd(bddTest);

Given('I am logged in', async ({ page, seed, world }) => {
  const email = `e2e-${randomUUID()}@vassembly.test`;
  const user = await seedUser({
    email,
    password: E2E_USER_PASSWORD,
    context: seed,
  });

  if (!page) {
    return;
  }

  if (world.auth) {
    await clearBrowserSession({ page });
  }

  await signInSeededUser({ page, email: user.email });

  world.auth = {
    userId: user.id,
    token: user.token,
    email: user.email,
  };
});

Given('I am authenticated as {string}', async ({ page, seed, world }, email: string) => {
  const user = await seedUser({
    email,
    password: E2E_USER_PASSWORD,
    context: seed,
  });

  if (!page) {
    return;
  }

  await signInSeededUser({ page, email: user.email });

  world.auth = {
    userId: user.id,
    token: user.token,
    email: user.email,
  };
});

Given('the current user has the admin role', async ({ page, seed, world }) => {
  if (!world.auth?.userId || !world.auth.email) {
    throw new Error('Current user must be logged in before granting admin role');
  }

  await promoteUserToAdmin({ context: seed, email: world.auth.email });

  if (!page) {
    return;
  }

  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await signInSeededUser({ page, email: world.auth.email });
});

When('my session expires', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
});

Given('my session has expired', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

Given('the network is unavailable', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.route('**', (route) => {
    if (route.request().resourceType() === 'document') {
      return route.continue();
    }
    return route.abort('internetdisconnected');
  });
});

Given('the network is restored', async ({ page }) => {
  if (!page) {
    return;
  }

  await page.unrouteAll();
});

Given(
  'the server returns a 500 error for {string} requests',
  async ({ page }, urlPattern: string) => {
    if (!page) {
      return;
    }

    await page.route(`**${urlPattern}**`, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      }),
    );
  },
);
