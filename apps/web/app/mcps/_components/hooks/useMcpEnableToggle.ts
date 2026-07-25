'use client';

import { useCallback, useState } from 'react';

import { useMcps, useSetMcpEnabled, useUserConfiguredMcps } from '@vassembly/ui-api-hooks';

export interface ToggleMcpEnabledParams {
  mcpId: string;
  enabled: boolean;
}

export interface UseMcpEnableToggleResult {
  toggleMcpEnabled: (params: ToggleMcpEnabledParams) => Promise<boolean>;
  togglingMcpId: string | null;
}

/**
 * Toggles MCP enabled state and refetches list queries.
 */
export const useMcpEnableToggle = (): UseMcpEnableToggleResult => {
  const [setMcpEnabled] = useSetMcpEnabled();
  const { refetch: refetchMcps } = useMcps();
  const { refetch: refetchConfiguredMcps } = useUserConfiguredMcps();
  const [togglingMcpId, setTogglingMcpId] = useState<string | null>(null);

  const toggleMcpEnabled = useCallback(
    async ({ mcpId, enabled }: ToggleMcpEnabledParams): Promise<boolean> => {
      setTogglingMcpId(mcpId);

      try {
        const result = await setMcpEnabled({ mcpId, enabled });

        if (result === undefined) {
          return false;
        }

        refetchMcps?.();
        refetchConfiguredMcps?.();

        return true;
      } finally {
        setTogglingMcpId(null);
      }
    },
    [refetchConfiguredMcps, refetchMcps, setMcpEnabled],
  );

  return {
    toggleMcpEnabled,
    togglingMcpId,
  };
};
