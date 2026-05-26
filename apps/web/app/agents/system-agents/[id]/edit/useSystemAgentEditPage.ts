'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  useHttpClient,
  useUpdateSystemAgent,
  type SystemAgentAdminItem,
  type SystemAgentFormInput,
} from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';
import { useParams, useRouter } from 'next/navigation';

import {
  getSystemAgentErrorMessage,
  isSystemAgentNameConflictError,
} from '../../../_components/PlatformAgentsSection/getSystemAgentErrorMessage';
import { SYSTEM_AGENTS_LIST_ANCHOR } from '../../../systemAgentRoutes';

const REDIRECT_AFTER_UPDATE_MS = 1500;

export type SystemAgentEditPageView =
  | { phase: 'loading' }
  | { phase: 'error'; message: string; onRetry: () => void }
  | {
      phase: 'ready';
      agent: SystemAgentAdminItem;
      isSubmitting: boolean;
      nameConflictError: string | undefined;
      handleSubmit: (input: SystemAgentFormInput) => Promise<void>;
      handleCancel: () => void;
    };

export interface UseSystemAgentEditPageResult {
  loginRoute: string;
  view: SystemAgentEditPageView;
}

export function useSystemAgentEditPage(): UseSystemAgentEditPageResult {
  const router = useRouter();
  const params = useParams();
  const http = useHttpClient();
  const snackbar = useSnackbar();
  const updateMutation = useUpdateSystemAgent();
  const agentIdParam = typeof params?.id === 'string' ? params.id : '';

  const [agent, setAgent] = useState<SystemAgentAdminItem | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [nameConflictError, setNameConflictError] = useState<string | undefined>(undefined);
  const [loadVersion, setLoadVersion] = useState(0);

  const loginRoute =
    agentIdParam === ''
      ? `/login?returnUrl=${encodeURIComponent('/')}`
      : `/login?returnUrl=${encodeURIComponent(`/agents/system-agents/${agentIdParam}/edit`)}`;

  const loadAgent = useCallback(async (): Promise<void> => {
    if (agentIdParam === '') {
      return;
    }
    try {
      const found = await http.get<SystemAgentAdminItem>({
        path: `/system-agents/${agentIdParam}`,
        withAuth: true,
      });
      setAgent(found);
      setLoadError(undefined);
    } catch (error) {
      setLoadError(getSystemAgentErrorMessage(error, 'Unable to load system agent'));
    }
  }, [agentIdParam, http]);

  useEffect(() => {
    void loadAgent();
  }, [loadAgent, loadVersion]);

  const handleRetry = useCallback((): void => {
    setAgent(undefined);
    setLoadError(undefined);
    setLoadVersion((current) => current + 1);
  }, []);

  const handleCancel = useCallback((): void => {
    router.push(SYSTEM_AGENTS_LIST_ANCHOR);
  }, [router]);

  const handleSubmit = useCallback(
    async (input: SystemAgentFormInput): Promise<void> => {
      if (agentIdParam === '') {
        return;
      }
      setNameConflictError(undefined);
      const result = await updateMutation.mutate({ id: agentIdParam, body: input });
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
      setTimeout(() => {
        router.push(SYSTEM_AGENTS_LIST_ANCHOR);
      }, REDIRECT_AFTER_UPDATE_MS);
    },
    [agentIdParam, router, snackbar, updateMutation],
  );

  const view = useMemo((): SystemAgentEditPageView => {
    if (agentIdParam === '') {
      return { phase: 'error', message: 'Unable to resolve system agent identifier.', onRetry: handleRetry };
    }
    if (loadError !== undefined) {
      return { phase: 'error', message: loadError, onRetry: handleRetry };
    }
    if (agent === undefined) {
      return { phase: 'loading' };
    }
    return {
      phase: 'ready',
      agent,
      isSubmitting: updateMutation.isLoading,
      nameConflictError,
      handleSubmit,
      handleCancel,
    };
  }, [
    agent,
    agentIdParam,
    handleCancel,
    handleRetry,
    handleSubmit,
    loadError,
    nameConflictError,
    updateMutation.isLoading,
  ]);

  return {
    loginRoute,
    view,
  };
}
