import { expect, type Locator, type Page } from '@playwright/test';

export const TASK_ACTIVITY_FEED_TEST_ID = 'task-activity-feed';
export const TASK_DETAIL_SKILLS_USED_TEST_ID = 'task-detail-skills-used';

export const getPlanRow = ({ page, commentId }: { page: Page; commentId: string }): Locator =>
  page.getByTestId(`activity-plan-${commentId}`);

export const getPlanToggle = ({ page, commentId }: { page: Page; commentId: string }): Locator =>
  page.getByTestId(`activity-plan-toggle-${commentId}`);

export const getPlanDetails = ({ page, commentId }: { page: Page; commentId: string }): Locator =>
  page.getByTestId(`activity-plan-details-${commentId}`);

export const getCommentSkillTags = ({ page, commentId }: { page: Page; commentId: string }): Locator =>
  page.getByTestId(`activity-comment-skills-${commentId}`);

export const getAgentResponseCard = ({ page, commentId }: { page: Page; commentId: string }): Locator =>
  page.getByTestId(`activity-agent-response-${commentId}`);

export const waitForTaskActivityFeed = async ({ page }: { page: Page }): Promise<void> => {
  await expect(page.getByTestId(TASK_ACTIVITY_FEED_TEST_ID)).toBeVisible({ timeout: 15_000 });
};
