'use client';

import { useCallback, useState } from 'react';

import { useUpsertSystemAgentPreference } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-system-design/snackbar';

import { getRequestErrorMessage } from '../../../../getRequestErrorMessage';

import type { UseSetSystemAgentPreferenceParams } from './types';

export const useSetSystemAgentPreference = ({
  onSuccess,
}: UseSetSystemAgentPreferenceParams = {}) => {
  const snackbar = useSnackbar();
  const { mutate, isLoading } = useUpsertSystemAgentPreference();
  const [savingCredentialId, setSavingCredentialId] = useState<string | null>(null);

  const setPreference = useCallback(
    async (credentialId: string): Promise<void> => {
      setSavingCredentialId(credentialId);
      try {
        const result = await mutate({
          body: { integrationCredentialId: credentialId },
        });
        if (result === undefined) {
          snackbar.show({
            variant: 'error',
            message: 'Failed to update system agent connection',
            duration: 5000,
          });
          return;
        }
        snackbar.show({
          variant: 'success',
          message: 'System agent connection updated',
          duration: 4000,
        });
        await onSuccess?.();
      } catch (setPreferenceError) {
        snackbar.show({
          variant: 'error',
          message: getRequestErrorMessage(
            setPreferenceError,
            'Failed to update system agent connection',
          ),
          duration: 5000,
        });
      } finally {
        setSavingCredentialId(null);
      }
    },
    [mutate, onSuccess, snackbar],
  );

  return {
    setPreference,
    isSaving: isLoading,
    savingCredentialId,
  };
};
