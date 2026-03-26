import { useEffect, useState } from 'react';
import type { UseTableArgs, UseTableResult } from './types';

export function useTable<TRow>({
  data,
  pageSize,
}: UseTableArgs<TRow>): UseTableResult<TRow> {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages =
    data.length === 0 ? 0 : Math.ceil(data.length / pageSize);

  useEffect(() => {
    if (totalPages === 0) {
      return;
    }
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const safePage =
    totalPages === 0
      ? 1
      : Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const paginatedRows = data.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number): void => {
    if (totalPages === 0) {
      return;
    }
    const nextPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(nextPage);
  };

  return {
    currentPage: safePage,
    totalPages,
    paginatedRows,
    onPageChange: handlePageChange,
  };
}
