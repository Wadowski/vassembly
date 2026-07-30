import { createBdd } from 'playwright-bdd';

import { bddTest } from '@vassembly/e2e';

import { getPlanDetails, getPlanToggle } from '../utils/taskPlanPage';
import type { WebBddWorld } from '../utils/types';

const { When } = createBdd(bddTest);

When('I expand the plan entry for that comment', async ({ page, world }) => {
  const webWorld = world as WebBddWorld;
  if (!page || !webWorld.commentId) {
    return;
  }

  const details = getPlanDetails({ page, commentId: webWorld.commentId });
  if (!(await details.isVisible())) {
    await getPlanToggle({ page, commentId: webWorld.commentId }).click();
  }
});
