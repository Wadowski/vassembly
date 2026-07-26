'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useUserConfiguredMcps } from '@vassembly/ui-api-hooks';

import type { McpWithConfigurationStatus } from '@vassembly/ui-api-hooks';

import { YOUR_MCPS_ICON_SIZE } from './constants';

export interface UseYourMcpsSectionResult {
  loading: boolean;
  configuredMcps: McpWithConfigurationStatus[];
  isEmpty: boolean;
  iconSize: number;
  currentPage: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  handlePageChange: (page: number) => void;
}

const YOUR_MCPS_PAGE_SIZE = 9;

/**
 * Loads paginated configured MCPs with catalog metadata for YOUR MCPs section.
 */
export const useYourMcpsSection = (): UseYourMcpsSectionResult => {
  const { data, loading, execute } = useUserConfiguredMcps();
  const [page, setPage] = useState(0);

  const refreshConfiguredMcps = useCallback(async (): Promise<void> => {
    await execute({
      page,
      size: YOUR_MCPS_PAGE_SIZE,
    });
  }, [execute, page]);

  useEffect(() => {
    void refreshConfiguredMcps();
  }, [refreshConfiguredMcps]);

  const handlePageChange = useCallback((newPage: number): void => {
    setPage(Math.max(0, newPage - 1));
  }, []);

  return useMemo(() => {
    const configuredMcps = data?.items ?? [];
    const total = data?.total ?? 0;
    const size = data?.size ?? YOUR_MCPS_PAGE_SIZE;
    const totalPages = total === 0 ? 0 : Math.ceil(total / size);
    const rangeStart = total === 0 ? 0 : page * size + 1;
    const rangeEnd = Math.min((page + 1) * size, total);

    return {
      loading,
      configuredMcps,
      isEmpty: !loading && configuredMcps.length === 0,
      iconSize: YOUR_MCPS_ICON_SIZE,
      currentPage: page + 1,
      totalPages,
      total,
      rangeStart,
      rangeEnd,
      handlePageChange,
    };
  }, [data, handlePageChange, loading, page]);
};
