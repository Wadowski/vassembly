'use client';

import { useMemo } from 'react';

import type { McpConfigurationStatus, McpListItem } from '@vassembly/ui-api-hooks';
import { useMcps } from '@vassembly/ui-api-hooks';

import { useMcpList } from './useMcpList';

export interface McpListItemWithStatus extends McpListItem {
  configurationStatus: McpConfigurationStatus;
  enabled: boolean;
  requiresConfiguration: boolean;
}

export interface UseMcpListWithStatusResult {
  list: ReturnType<typeof useMcpList>;
  itemsWithStatus: McpListItemWithStatus[];
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

  const statusLookup = useMemo(() => {
    const lookup = new Map<
      string,
      Pick<McpListItemWithStatus, 'configurationStatus' | 'enabled' | 'requiresConfiguration'>
    >();

    for (const mcp of allMcpsData?.mcps ?? []) {
      lookup.set(mcp.id, {
        configurationStatus: mcp.configurationStatus,
        enabled: mcp.enabled,
        requiresConfiguration: mcp.requiresConfiguration,
      });
    }

    return lookup;
  }, [allMcpsData?.mcps]);

  const itemsWithStatus = useMemo((): McpListItemWithStatus[] => {
    const enriched = list.items.map((item) => {
      const userStatus = statusLookup.get(item.id);

      return {
        ...item,
        configurationStatus: userStatus?.configurationStatus ?? 'pending',
        enabled: userStatus?.enabled ?? false,
        requiresConfiguration: userStatus?.requiresConfiguration ?? false,
      };
    });

    return sortByConfigurationStatus(enriched);
  }, [list.items, statusLookup]);

  return { list, itemsWithStatus };
};
