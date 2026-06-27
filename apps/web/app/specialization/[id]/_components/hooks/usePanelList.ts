'use client';

import { useCallback, useState } from 'react';

import { useDebouncedValue } from '../../../../../lib/hooks/useDebouncedValue';

import { SEARCH_DEBOUNCE_MS } from './constants';

export interface UsePanelListParams {
  total: number;
  size: number;
}

export interface UsePanelListResult {
  searchInput: string;
  debouncedSearch: string;
  page: number;
  currentPage: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  hasActiveSearch: boolean;
  handleSearchChange: (value: string) => void;
  handlePageChange: (newPage: number) => void;
  handleClearSearch: () => void;
}

export const usePanelList = ({ total, size }: UsePanelListParams): UsePanelListResult => {
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  const totalPages = total === 0 ? 0 : Math.ceil(total / size);
  const rangeStart = total === 0 ? 0 : page * size + 1;
  const rangeEnd = Math.min((page + 1) * size, total);
  const hasActiveSearch = debouncedSearch.trim() !== '';

  const handleSearchChange = useCallback((value: string): void => {
    setSearchInput(value);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number): void => {
    setPage(Math.max(0, newPage - 1));
  }, []);

  const handleClearSearch = useCallback((): void => {
    setSearchInput('');
    setPage(0);
  }, []);

  return {
    searchInput,
    debouncedSearch,
    page,
    currentPage: page + 1,
    totalPages,
    rangeStart,
    rangeEnd,
    hasActiveSearch,
    handleSearchChange,
    handlePageChange,
    handleClearSearch,
  };
};
