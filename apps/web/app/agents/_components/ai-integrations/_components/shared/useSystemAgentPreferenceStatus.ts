'use client';

import { useCallback, useEffect } from 'react';

import { NotFoundError } from '@vassembly/errors';
import { useSystemAgentPreference } from '@vassembly/ui-api-hooks';

export const useSystemAgentPreferenceStatus = () => {
  const { data, error, isLoading, fetch } = useSystemAgentPreference();

  const refetch = useCallback(async (): Promise<void> => {
    await fetch({});
  }, [fetch]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const isPreferenceNotFound = error instanceof NotFoundError;

  return {
    currentCredentialId: data?.integrationCredentialId,
    isLoading: isLoading && !isPreferenceNotFound,
    hasLoadError: error !== undefined && !isPreferenceNotFound,
    refetch,
  };
};
