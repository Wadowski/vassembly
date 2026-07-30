'use client';

import { useMemo } from 'react';

import type { McpWithConfigurationStatus } from '@vassembly/ui-api-hooks';

import { useMcpList } from './useMcpList';

export type McpListItemWithStatus = McpWithConfigurationStatus;

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

export const useMcpListWithStatus = (): UseMcpListWithStatusResult => {
  const list = useMcpList();

  const itemsWithStatus = useMemo(
    (): McpListItemWithStatus[] => sortByConfigurationStatus(list.items),
    [list.items],
  );

  return { list, itemsWithStatus };
};
