'use client';

import type { AgentCategory, AgentFormValues } from '@vassembly/ui-api-hooks';
import { useHttpClient } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { getRequestErrorMessage } from '../getRequestErrorMessage';

const REDIRECT_AFTER_CREATE_MS = 1500;

export interface UseAgentCreatePageResult {
  isSubmitting: boolean;
  handleCreate: (payload: AgentFormValues) => Promise<void>;
}

export function useAgentCreatePage(): UseAgentCreatePageResult {
  const router = useRouter();
  const http = useHttpClient();
  const snackbar = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = useCallback(
    async (payload: AgentFormValues): Promise<void> => {
      setIsSubmitting(true);
      try {
        await http.post({
          path: '/agents',
          withAuth: true,
          body: {
            name: payload.name,
            category: payload.category as AgentCategory,
            description: payload.description,
            rule: payload.rule,
            integrationCredentialId: payload.integrationCredentialId,
            assignedMcpIds: payload.assignedMcpIds,
            assignedToolIds: payload.assignedToolIds,
          },
        });
        snackbar.show({ variant: 'success', message: 'Agent created successfully', duration: 4000 });
        setTimeout(() => {
          router.push('/agents');
        }, REDIRECT_AFTER_CREATE_MS);
      } catch (error) {
        snackbar.show({
          variant: 'error',
          message: getRequestErrorMessage(error, 'Unable to create agent'),
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [http, router, snackbar],
  );

  return { isSubmitting, handleCreate };
}
