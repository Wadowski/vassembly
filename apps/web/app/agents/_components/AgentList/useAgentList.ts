'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { AgentDto } from '@vassembly/ui-api-hooks';
import { useAgents, useHttpClient } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { getRequestErrorMessage } from '../../getRequestErrorMessage';
import { AGENT_LIST_PAGE_SIZE, toAgentsListQuery } from './listQuery';
import { useAgentListFilters } from './useAgentListFilters';

export const useAgentList = () => {
  const router = useRouter();
  const snackbar = useSnackbar();
  const http = useHttpClient();
  const { data, fetch, isLoading } = useAgents();
  const {
    searchInput,
    debouncedSearch,
    statusFilter,
    page,
    handleSearchChange,
    handleStatusChange,
    handlePageChange,
  } = useAgentListFilters();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [focusAgent, setFocusAgent] = useState<AgentDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);

  const refreshList = useCallback(async (): Promise<void> => {
    await fetch({
      query: toAgentsListQuery({
        page,
        searchTrimmed: debouncedSearch.trim(),
        status: statusFilter,
      }),
    });
  }, [debouncedSearch, fetch, page, statusFilter]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const totalCount = data?.totalCount ?? 0;
  const items = data?.items ?? [];
  const totalPages =
    totalCount === 0 ? 0 : Math.ceil(totalCount / AGENT_LIST_PAGE_SIZE);

  const handleTablePageChange = useCallback(
    (newPage: number): void => {
      handlePageChange(newPage - 1);
    },
    [handlePageChange],
  );

  const confirmDelete = async (): Promise<void> => {
    if (focusAgent === null) {
      return;
    }
    setDeleteBusy(true);
    try {
      await http.delete({
        path: `/agents/${focusAgent.id}`,
        withAuth: true,
      });
      snackbar.show({ variant: 'success', message: 'Agent deleted', duration: 4000 });
      await refreshList();
    } catch (error) {
      snackbar.show({
        variant: 'error',
        message: getRequestErrorMessage(error, 'Unable to delete agent'),
        duration: 5000,
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const confirmRestore = async (): Promise<void> => {
    if (focusAgent === null) {
      return;
    }
    setRestoreBusy(true);
    try {
      await http.post<never, AgentDto>({
        path: `/agents/${focusAgent.id}/restore`,
        withAuth: true,
      });
      snackbar.show({ variant: 'success', message: 'Agent restored', duration: 4000 });
      await refreshList();
    } catch (error) {
      snackbar.show({
        variant: 'error',
        message: getRequestErrorMessage(error, 'Unable to restore agent'),
        duration: 5000,
      });
    } finally {
      setRestoreBusy(false);
    }
  };

  const handleNavigateCreate = useCallback((): void => {
    router.push('/agents/create');
  }, [router]);

  return {
    router,
    searchInput,
    statusFilter,
    currentPage: page + 1,
    totalPages,
    isLoading,
    dataAgents: items,
    deleteOpen,
    restoreOpen,
    focusAgentName: focusAgent?.name ?? '',
    deleteBusy,
    restoreBusy,
    handleNavigateCreate,
    handleSearchChange,
    handleStatusChange,
    handleTablePageChange,
    closeDeleteDialog: (): void => {
      setDeleteOpen(false);
    },
    closeRestoreDialog: (): void => {
      setRestoreOpen(false);
    },
    openDeleteFor: (agent: AgentDto): void => {
      setFocusAgent(agent);
      setDeleteOpen(true);
    },
    openRestoreFor: (agent: AgentDto): void => {
      setFocusAgent(agent);
      setRestoreOpen(true);
    },
    confirmDelete,
    confirmRestore,
  };
};
