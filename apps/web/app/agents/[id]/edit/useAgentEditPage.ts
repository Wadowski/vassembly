'use client';

import type { AgentCategory, AgentDto, AgentFormValues } from '@vassembly/ui-api-hooks';
import { useHttpClient } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getRequestErrorMessage } from '../../../../lib/agents/errorMessage';

const REDIRECT_AFTER_UPDATE_MS = 1500;

export type AgentEditPageView =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | {
      phase: 'ready';
      agent: AgentDto;
      isSubmitting: boolean;
      isRestoring: boolean;
      handleSubmit: (payload: AgentFormValues) => Promise<void>;
      handleRestore: () => Promise<void>;
    };

export interface UseAgentEditPageResult {
  loginRoute: string;
  view: AgentEditPageView;
}

export function useAgentEditPage(): UseAgentEditPageResult {
  const router = useRouter();
  const params = useParams();
  const http = useHttpClient();
  const snackbar = useSnackbar();
  const agentIdParam = typeof params?.id === 'string' ? params.id : '';

  const [agent, setAgent] = useState<AgentDto | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const loginRoute =
    agentIdParam === ''
      ? `/login?returnUrl=${encodeURIComponent('/')}`
      : `/login?returnUrl=${encodeURIComponent(`/agents/${agentIdParam}/edit`)}`;

  useEffect(() => {
    if (agentIdParam === '') {
      return;
    }
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const found = await http.get<AgentDto>({
          path: `/agents/${agentIdParam}`,
          withAuth: true,
        });
        if (!cancelled) {
          setAgent(found);
          setLoadError(undefined);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getRequestErrorMessage(error, 'Unable to load agent'));
        }
      }
    };
    void load();
    return (): void => {
      cancelled = true;
    };
  }, [agentIdParam, http]);

  const handleSubmit = useCallback(
    async (payload: AgentFormValues): Promise<void> => {
      if (agentIdParam === '') {
        return;
      }
      setIsSubmitting(true);
      try {
        await http.patch({
          path: `/agents/${agentIdParam}`,
          withAuth: true,
          body: {
            name: payload.name,
            category: payload.category as AgentCategory,
            description: payload.description,
            rule: payload.rule,
          },
        });
        snackbar.show({ variant: 'success', message: 'Agent updated successfully', duration: 4000 });
        setTimeout(() => {
          router.push('/agents');
        }, REDIRECT_AFTER_UPDATE_MS);
      } catch (error) {
        snackbar.show({
          variant: 'error',
          message: getRequestErrorMessage(error, 'Unable to update agent'),
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [agentIdParam, http, router, snackbar],
  );

  const handleRestore = useCallback(async (): Promise<void> => {
    if (agentIdParam === '') {
      return;
    }
    setIsRestoring(true);
    try {
      await http.post<never, AgentDto>({
        path: `/agents/${agentIdParam}/restore`,
        withAuth: true,
      });
      snackbar.show({ variant: 'success', message: 'Agent restored', duration: 4000 });
      const found = await http.get<AgentDto>({
        path: `/agents/${agentIdParam}`,
        withAuth: true,
      });
      setAgent(found);
    } catch (error) {
      snackbar.show({
        variant: 'error',
        message: getRequestErrorMessage(error, 'Unable to restore agent'),
        duration: 5000,
      });
    } finally {
      setIsRestoring(false);
    }
  }, [agentIdParam, http, snackbar]);

  const view = useMemo((): AgentEditPageView => {
    if (agentIdParam === '') {
      return { phase: 'error', message: 'Unable to resolve agent identifier.' };
    }
    if (loadError !== undefined) {
      return { phase: 'error', message: loadError };
    }
    if (agent === undefined) {
      return { phase: 'loading' };
    }
    return {
      phase: 'ready',
      agent,
      isSubmitting,
      isRestoring,
      handleSubmit,
      handleRestore,
    };
  }, [agent, agentIdParam, handleRestore, handleSubmit, isRestoring, isSubmitting, loadError]);

  return {
    loginRoute,
    view,
  };
}
