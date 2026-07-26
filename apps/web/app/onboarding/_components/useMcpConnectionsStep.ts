'use client';

import { useCallback, useState } from 'react';

import { useMcps, useSetZeroConfigMcpsEnabled } from '@vassembly/ui-api-hooks';

import { areZeroConfigMcpsEnabled } from './areZeroConfigMcpsEnabled';

export interface UseMcpConnectionsStepParams {
  isLocked: boolean;
}

export interface UseMcpConnectionsStepResult {
  isEnabled: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  handleToggle: (nextEnabled: boolean) => Promise<void>;
}

export const useMcpConnectionsStep = ({
  isLocked,
}: UseMcpConnectionsStepParams): UseMcpConnectionsStepResult => {
  const [setZeroConfigMcpsEnabled, { loading: isMutationLoading, error }] =
    useSetZeroConfigMcpsEnabled();
  const { data: mcpsData, loading: isMcpsLoading, refetch } = useMcps();
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);

  const serverEnabled = mcpsData?.mcps
    ? areZeroConfigMcpsEnabled({ mcps: mcpsData.mcps })
    : false;

  const isEnabled =
    isMutationLoading && pendingEnabled !== null ? pendingEnabled : serverEnabled;

  const handleToggle = useCallback(
    async (nextEnabled: boolean): Promise<void> => {
      setPendingEnabled(nextEnabled);

      try {
        const result = await setZeroConfigMcpsEnabled({ enabled: nextEnabled });

        if (result === undefined) {
          return;
        }

        await refetch?.();
      } finally {
        setPendingEnabled(null);
      }
    },
    [refetch, setZeroConfigMcpsEnabled],
  );

  return {
    isEnabled,
    isLoading: isMutationLoading || (!isLocked && isMcpsLoading),
    errorMessage: error?.message ?? null,
    handleToggle,
  };
};
