'use client';

import { useCallback, useState } from 'react';

import {
  useCreateSystemAgent,
  type SystemAgentFormInput,
} from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-system-design/snackbar';
import { useRouter } from 'next/navigation';

import {
  getSystemAgentErrorMessage,
  isSystemAgentNameConflictError,
} from '../../_components/PlatformAgentsSection/getSystemAgentErrorMessage';
import { SYSTEM_AGENTS_LIST_ANCHOR } from '../../systemAgentRoutes';

const REDIRECT_AFTER_CREATE_MS = 1500;

export interface UseSystemAgentCreatePageResult {
  isSubmitting: boolean;
  nameConflictError: string | undefined;
  handleCreate: (input: SystemAgentFormInput) => Promise<void>;
  handleCancel: () => void;
}

export function useSystemAgentCreatePage(): UseSystemAgentCreatePageResult {
  const router = useRouter();
  const snackbar = useSnackbar();
  const createMutation = useCreateSystemAgent();
  const [nameConflictError, setNameConflictError] = useState<string | undefined>(undefined);

  const handleCancel = useCallback((): void => {
    router.push(SYSTEM_AGENTS_LIST_ANCHOR);
  }, [router]);

  const handleCreate = useCallback(
    async (input: SystemAgentFormInput): Promise<void> => {
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
      setTimeout(() => {
        router.push(SYSTEM_AGENTS_LIST_ANCHOR);
      }, REDIRECT_AFTER_CREATE_MS);
    },
    [createMutation, router, snackbar],
  );

  return {
    isSubmitting: createMutation.isLoading,
    nameConflictError,
    handleCreate,
    handleCancel,
  };
}
