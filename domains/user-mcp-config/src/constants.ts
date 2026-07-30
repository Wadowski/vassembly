export const DEFAULT_PAGE = 0;

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_PAGE_SIZE = 50;

export const USER_MCP_CONFIG_STATUS = {
  Configured: 'configured',
} as const;

export type UserMcpConfigStatusValue =
  (typeof USER_MCP_CONFIG_STATUS)[keyof typeof USER_MCP_CONFIG_STATUS];
