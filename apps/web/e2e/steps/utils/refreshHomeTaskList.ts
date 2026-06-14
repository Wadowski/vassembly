import type { Page } from '@playwright/test';

export interface RefreshHomeTaskListIfNeededParams {
  page: Page | undefined;
}

export const refreshHomeTaskListIfNeeded = async ({
  page,
}: RefreshHomeTaskListIfNeededParams): Promise<void> => {
  if (!page) {
    return;
  }

  const currentUrl = new URL(page.url());
  if (currentUrl.pathname !== '/') {
    return;
  }

  await page.reload();
  await page.waitForResponse(
    (response) =>
      response.url().includes('/graphql') &&
      response.request().postData()?.includes('userTasks') === true,
    { timeout: 15_000 },
  );
};
