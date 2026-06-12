import { expect, type Page } from '@playwright/test';

const SETTINGS_READY_TIMEOUT_MS = 15_000;

const SETTINGS_FIELD_SECTIONS: Record<string, string> = {
  'First name': '#profile',
  'Last name': '#profile',
  'Current password': '#security',
  'New password': '#security',
  'Confirm password': '#security',
};

const SETTINGS_BUTTON_SECTIONS: Record<string, string> = {
  Save: '#profile',
  'Save new password': '#security',
  'Sign out': '#session',
};

export const dismissNavigationDrawer = async ({ page }: { page: Page }): Promise<void> => {
  const menuButton = page.getByRole('button', { name: /open menu/i });
  const isExpanded = await menuButton.getAttribute('aria-expanded');

  if (isExpanded !== 'true') {
    return;
  }

  await page.getByRole('button', { name: 'Close navigation' }).click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false', { timeout: 5_000 });
};

export const waitForSettingsPageReady = async ({ page }: { page: Page }): Promise<void> => {
  await dismissNavigationDrawer({ page });
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible({
    timeout: SETTINGS_READY_TIMEOUT_MS,
  });
  await expect(page.getByLabel('First name', { exact: true })).toBeEnabled({
    timeout: SETTINGS_READY_TIMEOUT_MS,
  });
};

const scrollToSettingsSection = async ({
  page,
  sectionSelector,
}: {
  page: Page;
  sectionSelector: string;
}): Promise<void> => {
  const section = page.locator(sectionSelector);
  await expect(section).toBeVisible({ timeout: SETTINGS_READY_TIMEOUT_MS });
  await section.scrollIntoViewIfNeeded();
};

export const fillSettingsField = async ({
  page,
  label,
  value,
}: {
  page: Page;
  label: string;
  value: string;
}): Promise<void> => {
  const sectionSelector = SETTINGS_FIELD_SECTIONS[label];

  if (sectionSelector) {
    await scrollToSettingsSection({ page, sectionSelector });
  }

  await dismissNavigationDrawer({ page });

  const field = page.getByLabel(label, { exact: true });
  await field.scrollIntoViewIfNeeded();
  await field.fill(value);
};

export const clickSettingsButton = async ({
  page,
  name,
}: {
  page: Page;
  name: string;
}): Promise<void> => {
  const sectionSelector = SETTINGS_BUTTON_SECTIONS[name];

  if (sectionSelector) {
    await scrollToSettingsSection({ page, sectionSelector });
  }

  await dismissNavigationDrawer({ page });

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await page.getByRole('button', { name: new RegExp(`^${escapedName}$`, 'i') }).click();
};
