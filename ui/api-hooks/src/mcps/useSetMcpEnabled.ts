import { CommonError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../http/useHttpClient';

import { handleMcpMutationError } from './handleMcpMutationError';
import type { McpConfigurationMutationState, SetMcpEnabledInput, SetMcpEnabledResponse } from './types';

interface SetMcpEnabledBody {
  enabled: boolean;
}

/**
 * Enables or disables an MCP for the current user.
 */
export function useSetMcpEnabled(): readonly [
  (input: SetMcpEnabledInput) => Promise<SetMcpEnabledResponse | undefined>,
  McpConfigurationMutationState,
] {
  const httpClient = useHttpClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CommonError | null>(null);

  const setEnabled = useCallback(
    async (input: SetMcpEnabledInput): Promise<SetMcpEnabledResponse | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response = await httpClient.patch<SetMcpEnabledBody, SetMcpEnabledResponse>({
          path: `/mcps/${input.mcpId}/enabled`,
          body: { enabled: input.enabled },
          withAuth: true,
        });

        return response;
      } catch (err) {
        return handleMcpMutationError({
          err,
          setError,
          defaultMessage: 'Failed to update MCP status',
        });
      } finally {
        setLoading(false);
      }
    },
    [httpClient],
  );

  return [setEnabled, { loading, error }] as const;
}
