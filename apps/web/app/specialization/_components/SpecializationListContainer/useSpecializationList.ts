'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useSpecializations } from '@vassembly/ui-api-hooks';

import { useDebouncedValue } from '../../../../lib/hooks/useDebouncedValue';
import { SPECIALIZATION_LIST_PATH } from '../../constants';

import {
  SEARCH_DEBOUNCE_MS,
  SPECIALIZATION_LIST_PAGE_SIZE,
} from './constants';
import type { SpecializationListContainerViewModel } from './types';

const parsePageParam = (value: string | null): number => {
  if (value === null) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
};

export const useSpecializationList = (): SpecializationListContainerViewModel => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, loading, error, execute } = useSpecializations();

  const [page, setPage] = useState(() => parsePageParam(searchParams.get('page')));
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '');
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  const refreshList = useCallback(async (): Promise<void> => {
    const trimmedSearch = debouncedSearch.trim();
    await execute({
      page,
      size: SPECIALIZATION_LIST_PAGE_SIZE,
      ...(trimmedSearch.length >= 1 ? { search: trimmedSearch } : {}),
    });
  }, [debouncedSearch, execute, page]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    const params = new URLSearchParams();
    const trimmedSearch = debouncedSearch.trim();

    if (trimmedSearch.length >= 1) {
      params.set('search', trimmedSearch);
    }

    if (page > 0) {
      params.set('page', String(page));
    }

    const query = params.toString();
    const nextUrl = query === '' ? SPECIALIZATION_LIST_PATH : `${SPECIALIZATION_LIST_PATH}?${query}`;

    router.replace(nextUrl, { scroll: false });
  }, [debouncedSearch, page, router]);

  const total = data?.total ?? 0;
  const size = data?.size ?? SPECIALIZATION_LIST_PAGE_SIZE;
  const items = data?.items ?? [];
  const totalPages = total === 0 ? 0 : Math.ceil(total / size);
  const hasActiveSearch = debouncedSearch.trim() !== '';
  const isEmpty = !loading && total === 0 && !hasActiveSearch;
  const isFilteredEmpty = !loading && total === 0 && hasActiveSearch;
  const rangeStart = total === 0 ? 0 : page * size + 1;
  const rangeEnd = Math.min((page + 1) * size, total);

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

  const handleRetry = useCallback((): void => {
    void refreshList();
  }, [refreshList]);

  const errorMessage = useMemo((): string | undefined => error?.message, [error]);

  return {
    searchInput,
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
    handlePageChange,
    handleClearSearch,
    handleRetry,
  };
};
