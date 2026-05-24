'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  PAGE_SIZE,
  useAiIntegrationDelete,
  useAiIntegrationRestore,
  useAiIntegrations,
  useTestConnection,
  type AiIntegrationCredentialDto,
} from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { useDebouncedValue } from '../../../../../../lib/hooks/useDebouncedValue';
import { getRequestErrorMessage } from '../../../../getRequestErrorMessage';
import {
  AI_INTEGRATIONS_CREATE_PATH,
  aiIntegrationEditPath,
} from '../../../../aiIntegrationRoutes';

import {
  AI_INTEGRATION_LIST_ALL_PROVIDERS,
  AI_INTEGRATION_LIST_ALL_STATUSES,
  type AiIntegrationListProviderFilter,
  type AiIntegrationListStatusFilter,
} from './types';

export const useAiIntegrationList = () => {
  const router = useRouter();
  const snackbar = useSnackbar();
  const { data, fetch, isLoading, error } = useAiIntegrations();
  const { mutate: deleteCredential, isLoading: isDeleting } = useAiIntegrationDelete();
  const { mutate: restoreCredential, isLoading: isRestoring } = useAiIntegrationRestore();
  const { mutate: testConnection, isLoading: isTesting } = useTestConnection();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<AiIntegrationListStatusFilter>(AI_INTEGRATION_LIST_ALL_STATUSES);
  const [providerFilter, setProviderFilter] = useState<AiIntegrationListProviderFilter>(
    AI_INTEGRATION_LIST_ALL_PROVIDERS,
  );
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AiIntegrationCredentialDto | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<AiIntegrationCredentialDto | null>(null);
  const [testingCredentialId, setTestingCredentialId] = useState<string | null>(null);

  const refreshList = useCallback(async (): Promise<void> => {
    await fetch({
      page,
      size: PAGE_SIZE,
      ...(debouncedSearch.trim() !== '' ? { search: debouncedSearch.trim() } : {}),
      ...(statusFilter !== AI_INTEGRATION_LIST_ALL_STATUSES ? { status: statusFilter } : {}),
      ...(providerFilter !== AI_INTEGRATION_LIST_ALL_PROVIDERS ? { provider: providerFilter } : {}),
    });
  }, [debouncedSearch, fetch, page, providerFilter, statusFilter]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const totalCount = data?.totalCount ?? 0;
  const items = data?.items ?? [];
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / PAGE_SIZE);

  const handleSearchChange = useCallback((value: string): void => {
    setSearchInput(value);
    setPage(0);
  }, []);

  const handleStatusChange = useCallback((value: AiIntegrationListStatusFilter): void => {
    setStatusFilter(value);
    setPage(0);
  }, []);

  const handleProviderChange = useCallback((value: AiIntegrationListProviderFilter): void => {
    setProviderFilter(value);
    setPage(0);
  }, []);

  const handleTablePageChange = useCallback((newPage: number): void => {
    setPage(Math.max(0, newPage - 1));
  }, []);

  const handleDelete = useCallback(async (): Promise<void> => {
    if (deleteTarget === null) {
      return;
    }
    const result = await deleteCredential({ id: deleteTarget.id });
    if (result === undefined) {
      snackbar.show({
        variant: 'error',
        message: 'Failed to delete integration',
        duration: 5000,
      });
      return;
    }
    snackbar.show({ variant: 'success', message: 'Integration deleted', duration: 4000 });
    setDeleteTarget(null);
    await refreshList();
  }, [deleteCredential, deleteTarget, refreshList, snackbar]);

  const handleRestore = useCallback(async (): Promise<void> => {
    if (restoreTarget === null) {
      return;
    }
    const result = await restoreCredential({ id: restoreTarget.id });
    if (result === undefined) {
      snackbar.show({
        variant: 'error',
        message: 'Failed to restore integration',
        duration: 5000,
      });
      return;
    }
    snackbar.show({ variant: 'success', message: 'Integration restored', duration: 4000 });
    setRestoreTarget(null);
    await refreshList();
  }, [refreshList, restoreCredential, restoreTarget, snackbar]);

  const handleTestConnection = useCallback(
    async (credential: AiIntegrationCredentialDto): Promise<void> => {
      setTestingCredentialId(credential.id);
      try {
        const result = await testConnection({ body: { credentialId: credential.id } });
        if (result?.success === true) {
          snackbar.show({
            variant: 'success',
            message: `Connection successful (${result.models?.length ?? 0} models)`,
            duration: 4000,
          });
          await refreshList();
          return;
        }
        snackbar.show({
          variant: 'error',
          message: result?.error ?? 'Connection test failed',
          duration: 5000,
        });
      } catch (testError) {
        snackbar.show({
          variant: 'error',
          message: getRequestErrorMessage(testError, 'Connection test failed'),
          duration: 5000,
        });
      } finally {
        setTestingCredentialId(null);
      }
    },
    [refreshList, snackbar, testConnection],
  );

  const handleNavigateCreate = useCallback((): void => {
    router.push(AI_INTEGRATIONS_CREATE_PATH);
  }, [router]);

  const handleNavigateEdit = useCallback(
    (credentialId: string): void => {
      router.push(aiIntegrationEditPath(credentialId));
    },
    [router],
  );

  const errorMessage = useMemo((): string | undefined => error?.message, [error]);

  return {
    router,
    searchInput,
    statusFilter,
    providerFilter,
    currentPage: page + 1,
    totalPages,
    isLoading,
    isDeleting,
    isRestoring,
    isTesting,
    testingCredentialId,
    items,
    errorMessage,
    deleteTarget,
    restoreTarget,
    handleSearchChange,
    handleStatusChange,
    handleProviderChange,
    handleTablePageChange,
    handleNavigateCreate,
    handleNavigateEdit,
    openDeleteFor: setDeleteTarget,
    closeDeleteDialog: (): void => setDeleteTarget(null),
    openRestoreFor: setRestoreTarget,
    closeRestoreDialog: (): void => setRestoreTarget(null),
    handleDelete,
    handleRestore,
    handleTestConnection,
  };
};
