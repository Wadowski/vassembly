export const USER_MCP_CONFIG_STATUS = {
  Configured: 'configured',
} as const;

export type UserMcpConfigStatusValue =
  (typeof USER_MCP_CONFIG_STATUS)[keyof typeof USER_MCP_CONFIG_STATUS];
