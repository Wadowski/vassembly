import { E2E_ADMIN_PASSWORD } from '../../constants';
import { Given } from '../../fixtures/bddTest';
import { seedAdminUser } from '../../seed/seedAdminUser';
import { seedUser } from '../../seed/seedUser';

Given(
  'a registered user exists with email {string} and password {string}',
  async ({ seed }, email: string, password: string) => {
    await seedUser({ email, password, context: seed });
  },
);

Given('I am logged in as admin', async ({ page, seed, world }) => {
  const admin = await seedAdminUser({ context: seed });

  if (!page) {
    return;
  }

  await page.goto('/login');
  await page.getByLabel('Email').fill(admin.email);
  await page.getByLabel('Password').fill(E2E_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  world.auth = {
    userId: admin.id,
    token: admin.token,
    email: admin.email,
  };
});
