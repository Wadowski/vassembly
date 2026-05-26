'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  SYSTEM_AGENT_LIST_ALL_STATUSES,
  useArchiveSystemAgent,
  useRestoreSystemAgent,
  useSystemAgents,
  type SystemAgentAdminItem,
} from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { getSystemAgentErrorMessage } from './getSystemAgentErrorMessage';
import { usePlatformAgentListFilters } from './usePlatformAgentListFilters';

const PLATFORM_AGENT_PAGE_SIZE = 50;

export const usePlatformAgentsSection = () => {
  const snackbar = useSnackbar();
  const { data, fetch, isLoading } = useSystemAgents();
  const archiveMutation = useArchiveSystemAgent();
  const restoreMutation = useRestoreSystemAgent();

  const filters = usePlatformAgentListFilters();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [invokeOpen, setInvokeOpen] = useState(false);
  const [focusAgent, setFocusAgent] = useState<SystemAgentAdminItem | null>(null);

  const refreshList = useCallback(async (): Promise<void> => {
    const search = filters.debouncedSearch.trim();
    await fetch({
      search: search === '' ? undefined : search,
      size: PLATFORM_AGENT_PAGE_SIZE,
      status:
        filters.statusFilter === SYSTEM_AGENT_LIST_ALL_STATUSES
          ? undefined
          : filters.statusFilter,
    });
  }, [fetch, filters.debouncedSearch, filters.statusFilter]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const rawItems = data?.items ?? [];
  const filteredItems = useMemo(() => {
    if (filters.categoryFilter === SYSTEM_AGENT_LIST_ALL_STATUSES) {
      return rawItems;
    }
    return rawItems.filter((agent) => agent.category === filters.categoryFilter);
  }, [filters.categoryFilter, rawItems]);
  const hasSearch = filters.debouncedSearch.trim() !== '';
  const isFilteredEmpty =
    !isLoading &&
    filteredItems.length === 0 &&
    (hasSearch || filters.categoryFilter !== SYSTEM_AGENT_LIST_ALL_STATUSES);
  const isEmpty =
    !isLoading &&
    filteredItems.length === 0 &&
    !hasSearch &&
    filters.categoryFilter === SYSTEM_AGENT_LIST_ALL_STATUSES;

  const confirmArchive = async (): Promise<void> => {
    if (focusAgent === null) {
      return;
    }
    const result = await archiveMutation.mutate({ id: focusAgent.id });
    if (result === undefined) {
      snackbar.show({
        variant: 'error',
        message: getSystemAgentErrorMessage(archiveMutation.error, 'Unable to archive system agent'),
        duration: 5000,
      });
      throw new Error('archive-failed');
    }
    snackbar.show({ variant: 'success', message: 'Platform agent archived.', duration: 4000 });
    await refreshList();
  };

  const confirmRestore = async (): Promise<void> => {
    if (focusAgent === null) {
      return;
    }
    const result = await restoreMutation.mutate({ id: focusAgent.id });
    if (result === undefined) {
      snackbar.show({
        variant: 'error',
        message: getSystemAgentErrorMessage(restoreMutation.error, 'Unable to restore system agent'),
        duration: 5000,
      });
      throw new Error('restore-failed');
    }
    snackbar.show({ variant: 'success', message: 'Platform agent restored.', duration: 4000 });
    await refreshList();
  };

  return {
    filters,
    agents: filteredItems,
    isLoading,
    isEmpty,
    isFilteredEmpty,
    archiveOpen,
    restoreOpen,
    invokeOpen,
    focusAgent,
    focusAgentName: focusAgent?.name ?? '',
    isArchiveBusy: archiveMutation.isLoading,
    isRestoreBusy: restoreMutation.isLoading,
    openArchiveFor: (agent: SystemAgentAdminItem): void => {
      setFocusAgent(agent);
      setArchiveOpen(true);
    },
    openRestoreFor: (agent: SystemAgentAdminItem): void => {
      setFocusAgent(agent);
      setRestoreOpen(true);
    },
    openInvokeFor: (agent: SystemAgentAdminItem): void => {
      setFocusAgent(agent);
      setInvokeOpen(true);
    },
    closeArchive: (): void => setArchiveOpen(false),
    closeRestore: (): void => setRestoreOpen(false),
    closeInvoke: (): void => setInvokeOpen(false),
    confirmArchive,
    confirmRestore,
  };
};
