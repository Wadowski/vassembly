'use client';

import { useCallback, useMemo, useState } from 'react';

import { useMcpUsageHistory } from '@vassembly/ui-api-hooks';

import { MCP_USAGE_HISTORY_PAGE_SIZE } from './constants';
import type { UseMcpUsageHistorySectionArgs, UseMcpUsageHistorySectionResult } from './types';

export const useMcpUsageHistorySection = ({
  mcpId,
}: UseMcpUsageHistorySectionArgs): UseMcpUsageHistorySectionResult => {
  const [page, setPage] = useState(0);

  const { items, total, size, loading } = useMcpUsageHistory({
    mcpId,
    page,
    size: MCP_USAGE_HISTORY_PAGE_SIZE,
  });

  const handlePageChange = useCallback((newPage: number): void => {
    setPage(Math.max(0, newPage - 1));
  }, []);

  return useMemo(() => {
    const pageSize = size || MCP_USAGE_HISTORY_PAGE_SIZE;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const rangeStart = total === 0 ? 0 : page * pageSize + 1;
    const rangeEnd = Math.min((page + 1) * pageSize, total);

    return {
      items,
      loading,
      isEmpty: !loading && items.length === 0,
      currentPage: page + 1,
      totalPages,
      total,
      rangeStart,
      rangeEnd,
      handlePageChange,
    };
  }, [handlePageChange, items, loading, page, size, total]);
};
