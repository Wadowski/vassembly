'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useMcps } from '@vassembly/ui-api-hooks';

import { useDebouncedValue } from '../../../../lib/hooks/useDebouncedValue';

import { MCP_LIST_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from './constants';
import type { McpListContainerViewModel } from './types';

export const useMcpList = (): McpListContainerViewModel => {
  const { data, loading, error, execute } = useMcps();
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const refreshList = useCallback(async (): Promise<void> => {
    const trimmedSearch = debouncedSearch.trim();
    await execute({
      page,
      size: MCP_LIST_PAGE_SIZE,
      ...(trimmedSearch !== '' ? { search: trimmedSearch } : {}),
      ...(selectedTags.length > 0 ? { tags: selectedTags } : {}),
    });
  }, [debouncedSearch, execute, page, selectedTags]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const total = data?.total ?? 0;
  const size = data?.size ?? MCP_LIST_PAGE_SIZE;
  const items = data?.items ?? [];
  const totalPages = total === 0 ? 0 : Math.ceil(total / size);
  const hasActiveFilters = debouncedSearch.trim() !== '' || selectedTags.length > 0;
  const isEmpty = !loading && total === 0 && !hasActiveFilters;
  const isFilteredEmpty = !loading && total === 0 && hasActiveFilters;
  const rangeStart = total === 0 ? 0 : page * size + 1;
  const rangeEnd = Math.min((page + 1) * size, total);

  const handleSearchChange = useCallback((value: string): void => {
    setSearchInput(value);
    setPage(0);
  }, []);

  const handleTagsChange = useCallback((tags: string[]): void => {
    setSelectedTags(tags);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number): void => {
    setPage(Math.max(0, newPage - 1));
  }, []);

  const handleClearSearch = useCallback((): void => {
    setSearchInput('');
    setPage(0);
  }, []);

  const handleResetTags = useCallback((): void => {
    setSelectedTags([]);
    setPage(0);
  }, []);

  const errorMessage = useMemo((): string | undefined => error?.message, [error]);

  return {
    searchInput,
    selectedTags,
    items,
    loading,
    errorMessage,
    currentPage: page + 1,
    totalPages,
    total,
    rangeStart,
    rangeEnd,
    isEmpty,
    isFilteredEmpty,
    handleSearchChange,
    handleTagsChange,
    handlePageChange,
    handleClearSearch,
    handleResetTags,
  };
};
