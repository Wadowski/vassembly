import { expect, type Page } from '@playwright/test';

export const PROGRESS_LIST_TEST_ID = 'progress-list';

export const waitForTaskDetailPageReady = async ({ page }: { page: Page }): Promise<void> => {
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('task-detail-title')).toBeVisible({ timeout: 15_000 });
};

export const navigateToTaskDetailPage = async ({
  page,
  taskId,
}: {
  page: Page;
  taskId: string;
}): Promise<void> => {
  await page.goto(`/tasks/${taskId}`);
  await waitForTaskDetailPageReady({ page });
};

export const waitForProgressListReady = async ({ page }: { page: Page }): Promise<void> => {
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId(PROGRESS_LIST_TEST_ID)).toBeVisible({ timeout: 15_000 });
};

export const reloadTaskDetailPage = async ({ page }: { page: Page }): Promise<void> => {
  await page.reload();
  await waitForProgressListReady({ page });
};
