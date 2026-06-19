import { E2E_ADMIN_PASSWORD } from '../../constants';
import { Given } from '../../fixtures/bddTest';
import { seedAdminUser } from '../../seed/seedAdminUser';
import { seedUser } from '../../seed/seedUser';
import { signInUser } from '../../utils/signIn';

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

  await signInUser({ page, email: admin.email, password: E2E_ADMIN_PASSWORD });

  world.auth = {
    userId: admin.id,
    token: admin.token,
    email: admin.email,
  };
});
