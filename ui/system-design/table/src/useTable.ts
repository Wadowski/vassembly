import { useEffect, useState } from 'react';
import type { UseTableArgs, UseTableResult } from './types';

export function useTable<TRow>({
  data,
  pageSize,
  isControlled = false,
  currentPage: controlledPage,
  totalPages: controlledTotalPages,
}: UseTableArgs<TRow>): UseTableResult<TRow> {
  const [internalPage, setInternalPage] = useState(1);

  const isServerPaginated =
    isControlled &&
    controlledPage !== undefined &&
    controlledTotalPages !== undefined;

  const totalPages = isServerPaginated
    ? controlledTotalPages
    : data.length === 0
      ? 0
      : Math.ceil(data.length / pageSize);

  useEffect(() => {
    if (isServerPaginated || totalPages === 0) {
      return;
    }
    if (internalPage > totalPages) {
      setInternalPage(totalPages);
    }
  }, [internalPage, isServerPaginated, totalPages]);

  const safePage = isServerPaginated
    ? totalPages === 0
      ? 1
      : Math.min(Math.max(1, controlledPage), totalPages)
    : totalPages === 0
      ? 1
      : Math.min(Math.max(1, internalPage), totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const paginatedRows = isServerPaginated
    ? data
    : data.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number): void => {
    if (isServerPaginated || totalPages === 0) {
      return;
    }
    const nextPage = Math.max(1, Math.min(page, totalPages));
    setInternalPage(nextPage);
  };

  return {
    currentPage: safePage,
    totalPages,
    paginatedRows,
    onPageChange: handlePageChange,
  };
}
