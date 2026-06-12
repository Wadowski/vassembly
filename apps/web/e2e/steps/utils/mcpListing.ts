import type { Page } from '@playwright/test';

export const MCP_PAGE_LOAD_TIMEOUT_MS = 30_000;

export const waitForMcpListing = async ({ page }: { page: Page }): Promise<void> => {
  await page.getByRole('heading', { name: 'MCPs', level: 1 }).waitFor({ timeout: MCP_PAGE_LOAD_TIMEOUT_MS });
  await page.getByRole('region', { name: 'DISCOVER' }).waitFor({ timeout: MCP_PAGE_LOAD_TIMEOUT_MS });
};

export const getDiscoverMcpLink = ({ page, mcpName }: { page: Page; mcpName: string }) =>
  page.getByRole('region', { name: 'DISCOVER' }).getByRole('link', { name: `Configure ${mcpName}` });

export const getYourMcpsMcpLink = ({ page, mcpName }: { page: Page; mcpName: string }) =>
  page.getByTestId('your-mcps-grid').getByRole('link', { name: `Configure ${mcpName}` });

export const resolveMcpStatusBadgeLabel = (badgeLabel: string): string =>
  badgeLabel.charAt(0).toUpperCase() + badgeLabel.slice(1);
