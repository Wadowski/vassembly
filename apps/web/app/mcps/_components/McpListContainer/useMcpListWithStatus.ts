'use client';

import { useMemo } from 'react';

import type { McpConfigurationStatus, McpListItem } from '@vassembly/ui-api-hooks';
import { useMcps, useUserConfiguredMcps } from '@vassembly/ui-api-hooks';

import { useMcpList } from './useMcpList';

export interface McpListItemWithStatus extends McpListItem {
  configurationStatus: McpConfigurationStatus;
}

export interface UseMcpListWithStatusResult {
  list: ReturnType<typeof useMcpList>;
  itemsWithStatus: McpListItemWithStatus[];
  configuredMcpIds: Set<string>;
}

const sortByConfigurationStatus = (items: McpListItemWithStatus[]): McpListItemWithStatus[] =>
  [...items].sort((first, second) => {
    if (first.configurationStatus === second.configurationStatus) {
      return 0;
    }

    if (first.configurationStatus === 'configured') {
      return -1;
    }

    return 1;
  });

/**
 * Merges catalog pagination data with configuration status from useMcps.
 */
export const useMcpListWithStatus = (): UseMcpListWithStatusResult => {
  const list = useMcpList();
  const { data: allMcpsData } = useMcps();
  const { data: configuredData } = useUserConfiguredMcps();

  const configuredMcpIds = useMemo(
    () => new Set(configuredData?.mcps.map((config) => config.mcpId) ?? []),
    [configuredData?.mcps],
  );

  const statusLookup = useMemo(() => {
    const lookup = new Map<string, McpConfigurationStatus>();

    for (const mcp of allMcpsData?.mcps ?? []) {
      lookup.set(mcp.id, mcp.configurationStatus);
    }

    return lookup;
  }, [allMcpsData?.mcps]);

  const itemsWithStatus = useMemo((): McpListItemWithStatus[] => {
    const enriched = list.items.map((item) => ({
      ...item,
      configurationStatus: statusLookup.get(item.id) ?? 'pending',
    }));

    return sortByConfigurationStatus(enriched);
  }, [list.items, statusLookup]);

  return { list, itemsWithStatus, configuredMcpIds };
};
