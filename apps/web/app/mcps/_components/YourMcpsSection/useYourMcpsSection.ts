'use client';

import { useMemo } from 'react';

import type { McpWithConfigurationStatus } from '@vassembly/ui-api-hooks';
import { useMcps, useUserConfiguredMcps } from '@vassembly/ui-api-hooks';

import { YOUR_MCPS_ICON_SIZE } from './constants';

export interface UseYourMcpsSectionResult {
  loading: boolean;
  configuredMcps: McpWithConfigurationStatus[];
  isEmpty: boolean;
  iconSize: number;
}

/**
 * Loads configured MCPs and joins catalog metadata for YOUR MCPs section.
 */
export const useYourMcpsSection = (): UseYourMcpsSectionResult => {
  const { data: configuredData, loading: configuredLoading } = useUserConfiguredMcps();
  const { data: allMcpsData } = useMcps();

  const configuredMcps = useMemo((): McpWithConfigurationStatus[] => {
    const lookup = new Map(allMcpsData?.mcps.map((mcp) => [mcp.id, mcp]));

    return (configuredData?.mcps ?? [])
      .map((config) => lookup.get(config.mcpId))
      .filter((mcp): mcp is McpWithConfigurationStatus => mcp !== undefined);
  }, [allMcpsData?.mcps, configuredData?.mcps]);

  return {
    loading: configuredLoading,
    configuredMcps,
    isEmpty: !configuredLoading && configuredMcps.length === 0,
    iconSize: YOUR_MCPS_ICON_SIZE,
  };
};
