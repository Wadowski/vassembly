import type { BrowserContext, Page } from '@playwright/test';

export interface CloseBrowserContextParams {
  context: BrowserContext;
}

export const closeBrowserContext = async ({
  context,
}: CloseBrowserContextParams): Promise<void> => {
  for (const openPage of context.pages()) {
    if (!openPage.isClosed()) {
      await openPage.close();
    }
  }

  await context.close();
};

export interface CloseE2eBrowserResourcesParams {
  page: Page;
  context?: BrowserContext;
}

export const closeE2eBrowserResources = async ({
  page,
  context,
}: CloseE2eBrowserResourcesParams): Promise<void> => {
  const browserContext = context ?? page.context();

  if (!page.isClosed()) {
    await page.close();
  }

  await closeBrowserContext({ context: browserContext });
};
