import { expect, type Page } from '@playwright/test';

const LIST_READY_TIMEOUT_MS = 15_000;
const SEARCH_DEBOUNCE_MS = 400;

export const waitForSpecializationListing = async ({ page }: { page: Page }): Promise<void> => {
  await expect(page.getByRole('heading', { name: 'Specializations', exact: true })).toBeVisible({
    timeout: LIST_READY_TIMEOUT_MS,
  });
};

export const getSpecializationCardLink = ({
  page,
  specializationName,
}: {
  page: Page;
  specializationName: string;
}): ReturnType<Page['getByRole']> => {
  const displayName = specializationName.trim().charAt(0).toUpperCase() + specializationName.trim().slice(1).toLowerCase();

  return page.getByRole('link', { name: new RegExp(`View specialization ${displayName}`, 'i') });
};

export const searchSpecializations = async ({
  page,
  query,
}: {
  page: Page;
  query: string;
}): Promise<void> => {
  await waitForSpecializationListing({ page });
  await page.getByPlaceholder('Search specializations').fill(query);
  await page.waitForTimeout(SEARCH_DEBOUNCE_MS);
};
