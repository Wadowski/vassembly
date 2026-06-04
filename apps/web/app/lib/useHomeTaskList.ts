'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { TaskDto } from '@vassembly/ui-api-hooks';
import { useUserTasks } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { getRequestErrorMessage } from '../agents/getRequestErrorMessage';
import { SEARCH_DEBOUNCE_MS, TASK_LIST_PAGE_SIZE } from '../_components/TaskList/constants';
import { useDebouncedValue } from '../../lib/hooks/useDebouncedValue';

export const useHomeTaskList = () => {
  const snackbar = useSnackbar();
  const { fetch, isLoading } = useUserTasks();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const isRefreshingRef = useRef(false);
  const activeRequestRef = useRef(0);

  const hasMore = tasks.length < totalCount;

  const loadPage = useCallback(
    async ({
      page: pageToLoad,
      append,
      search,
    }: {
      page: number;
      append: boolean;
      search: string;
    }): Promise<void> => {
      const requestId = ++activeRequestRef.current;
      const trimmedSearch = search.trim();

      try {
        if (append) {
          setIsLoadingMore(true);
        }

        const result = await fetch({
          query: {
            page: pageToLoad,
            size: TASK_LIST_PAGE_SIZE,
            search: trimmedSearch === '' ? undefined : trimmedSearch,
          },
        });

        if (requestId !== activeRequestRef.current) {
          return;
        }

        if (result === undefined) {
          return;
        }

        setTotalCount(result.totalCount);
        setPage(result.page);
        setTasks((current) => (append ? [...current, ...result.items] : result.items));
      } catch (error) {
        if (requestId !== activeRequestRef.current) {
          return;
        }

        snackbar.show({
          variant: 'error',
          message: getRequestErrorMessage(error, 'Unable to load tasks'),
          duration: 5000,
        });
      } finally {
        if (append && requestId === activeRequestRef.current) {
          setIsLoadingMore(false);
        }
      }
    },
    [fetch, snackbar],
  );

  useEffect(() => {
    if (isRefreshingRef.current) {
      return;
    }

    void loadPage({ page: 0, append: false, search: debouncedSearch });
  }, [debouncedSearch, loadPage]);

  const handleSearchChange = useCallback((value: string): void => {
    setSearchInput(value);
    setPage(0);
  }, []);

  const handleLoadMore = useCallback(async (): Promise<void> => {
    const nextPage = page + 1;
    await loadPage({ page: nextPage, append: true, search: debouncedSearch });
  }, [debouncedSearch, loadPage, page]);

  const refreshFromStart = useCallback(async (): Promise<void> => {
    activeRequestRef.current += 1;
    isRefreshingRef.current = true;
    setSearchInput('');
    setPage(0);

    const requestId = ++activeRequestRef.current;

    try {
      const result = await fetch({
        query: {
          page: 0,
          size: TASK_LIST_PAGE_SIZE,
        },
      });

      if (requestId !== activeRequestRef.current) {
        return;
      }

      if (result === undefined) {
        return;
      }

      setTotalCount(result.totalCount);
      setTasks(result.items);
      setPage(result.page);
    } catch (error) {
      if (requestId !== activeRequestRef.current) {
        return;
      }

      snackbar.show({
        variant: 'error',
        message: getRequestErrorMessage(error, 'Unable to load tasks'),
        duration: 5000,
      });
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetch, snackbar]);

  return {
    tasks,
    isLoading,
    isLoadingMore,
    hasMore,
    searchInput,
    handleSearchChange,
    handleLoadMore,
    refreshFromStart,
  };
};
