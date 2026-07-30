import { expect, type Locator, type Page } from '@playwright/test';

import { TASK_ACTIVITY_FEED_TEST_ID } from './taskPlanPage';

export const CLASSIFIER_AGENT_NAME = 'Specialization classifier';

export const getUserCommentCard = ({
  page,
  commentId,
}: {
  page: Page;
  commentId: string;
}): Locator => page.getByTestId(`activity-user-comment-${commentId}`);

export const getCommentSpecializationRegion = ({
  page,
  commentId,
}: {
  page: Page;
  commentId: string;
}): Locator =>
  getUserCommentCard({ page, commentId }).getByLabel('Linked specializations');

export const getClassifierProgressRow = ({ page }: { page: Page }): Locator =>
  page.getByRole('button', { name: new RegExp(CLASSIFIER_AGENT_NAME, 'i') }).first();

export const getProgressEventRows = ({ page }: { page: Page }): Locator =>
  page.locator('[data-testid^="activity-progress-event-"]');

export const expandClassifierProgressRow = async ({ page }: { page: Page }): Promise<void> => {
  const row = getClassifierProgressRow({ page });
  await expect(row).toBeVisible();
  const isExpanded = await row.getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await row.click();
  }
};

export const waitForTaskActivityFeed = async ({ page }: { page: Page }): Promise<void> => {
  await expect(page.getByTestId(TASK_ACTIVITY_FEED_TEST_ID)).toBeVisible({ timeout: 15_000 });
};
