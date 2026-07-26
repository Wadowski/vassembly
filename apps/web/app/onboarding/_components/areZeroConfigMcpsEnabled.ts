import type { McpWithConfigurationStatus } from '@vassembly/ui-api-hooks';

export interface AreZeroConfigMcpsEnabledParams {
  mcps: McpWithConfigurationStatus[];
}

export const areZeroConfigMcpsEnabled = ({
  mcps,
}: AreZeroConfigMcpsEnabledParams): boolean => {
  const zeroConfigMcps = mcps.filter((mcp) => !mcp.requiresConfiguration);

  if (zeroConfigMcps.length === 0) {
    return false;
  }

  return zeroConfigMcps.every((mcp) => mcp.enabled);
};
