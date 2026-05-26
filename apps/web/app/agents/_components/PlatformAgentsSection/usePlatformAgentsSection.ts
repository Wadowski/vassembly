'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  SYSTEM_AGENT_LIST_ALL_STATUSES,
  useArchiveSystemAgent,
  useCreateSystemAgent,
  useRestoreSystemAgent,
  useSystemAgents,
  useUpdateSystemAgent,
  type SystemAgentAdminItem,
  type SystemAgentFormInput,
} from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';

import {
  getSystemAgentErrorMessage,
  isSystemAgentNameConflictError,
} from './getSystemAgentErrorMessage';
import { usePlatformAgentListFilters } from './usePlatformAgentListFilters';

const PLATFORM_AGENT_PAGE_SIZE = 50;

export const usePlatformAgentsSection = () => {
  const snackbar = useSnackbar();
  const adminList = useSystemAgents();
  const createMutation = useCreateSystemAgent();
  const updateMutation = useUpdateSystemAgent();
  const archiveMutation = useArchiveSystemAgent();
  const restoreMutation = useRestoreSystemAgent();

  const filters = usePlatformAgentListFilters();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [invokeOpen, setInvokeOpen] = useState(false);
  const [focusAgent, setFocusAgent] = useState<SystemAgentAdminItem | null>(null);
  const [nameConflictError, setNameConflictError] = useState<string | undefined>(undefined);

  const refreshList = useCallback(async (): Promise<void> => {
    const search = filters.debouncedSearch.trim();
    await adminList.fetch({
      query: {
        search: search === '' ? undefined : search,
        size: PLATFORM_AGENT_PAGE_SIZE,
        status:
          filters.statusFilter === SYSTEM_AGENT_LIST_ALL_STATUSES
            ? undefined
            : filters.statusFilter,
      },
    });
  }, [adminList, filters.debouncedSearch, filters.statusFilter]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const rawItems = adminList.data?.items ?? [];
  const filteredItems = useMemo(() => {
    if (filters.categoryFilter === SYSTEM_AGENT_LIST_ALL_STATUSES) {
      return rawItems;
    }
    return rawItems.filter((agent) => agent.category === filters.categoryFilter);
  }, [filters.categoryFilter, rawItems]);

  const isLoading = adminList.isLoading;
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

  const handleCreate = async (input: SystemAgentFormInput): Promise<void> => {
    setNameConflictError(undefined);
    const result = await createMutation.mutate({ body: input });
    if (result === undefined) {
      if (isSystemAgentNameConflictError(createMutation.error)) {
        setNameConflictError('An agent with this name already exists.');
        throw new Error('name-conflict');
      }
      snackbar.show({
        variant: 'error',
        message: getSystemAgentErrorMessage(createMutation.error, 'Unable to create system agent'),
        duration: 5000,
      });
      throw new Error('create-failed');
    }
    snackbar.show({ variant: 'success', message: 'System agent created.', duration: 4000 });
    setCreateOpen(false);
    await refreshList();
  };

  const handleUpdate = async (input: SystemAgentFormInput): Promise<void> => {
    if (focusAgent === null) {
      return;
    }
    setNameConflictError(undefined);
    const result = await updateMutation.mutate({ id: focusAgent.id, body: input });
    if (result === undefined) {
      if (isSystemAgentNameConflictError(updateMutation.error)) {
        setNameConflictError('An agent with this name already exists.');
        throw new Error('name-conflict');
      }
      snackbar.show({
        variant: 'error',
        message: getSystemAgentErrorMessage(updateMutation.error, 'Unable to update system agent'),
        duration: 5000,
      });
      throw new Error('update-failed');
    }
    snackbar.show({ variant: 'success', message: 'System agent updated.', duration: 4000 });
    setEditOpen(false);
    await refreshList();
  };

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
    createOpen,
    editOpen,
    archiveOpen,
    restoreOpen,
    invokeOpen,
    focusAgent,
    focusAgentName: focusAgent?.name ?? '',
    nameConflictError,
    isCreateSubmitting: createMutation.isLoading,
    isUpdateSubmitting: updateMutation.isLoading,
    isArchiveBusy: archiveMutation.isLoading,
    isRestoreBusy: restoreMutation.isLoading,
    openCreate: (): void => {
      setNameConflictError(undefined);
      setCreateOpen(true);
    },
    closeCreate: (): void => setCreateOpen(false),
    openEditFor: (agent: SystemAgentAdminItem): void => {
      setFocusAgent(agent);
      setNameConflictError(undefined);
      setEditOpen(true);
    },
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
    closeEdit: (): void => setEditOpen(false),
    closeArchive: (): void => setArchiveOpen(false),
    closeRestore: (): void => setRestoreOpen(false),
    closeInvoke: (): void => setInvokeOpen(false),
    handleCreate,
    handleUpdate,
    confirmArchive,
    confirmRestore,
  };
};
