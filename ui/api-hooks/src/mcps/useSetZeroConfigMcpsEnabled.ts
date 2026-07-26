import { CommonError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../http/useHttpClient';

import { handleMcpMutationError } from './handleMcpMutationError';
import type {
  McpConfigurationMutationState,
  SetZeroConfigMcpsEnabledResponse,
} from './types';

interface SetZeroConfigMcpsEnabledBody {
  enabled: boolean;
}

export interface SetZeroConfigMcpsEnabledInput {
  enabled: boolean;
}

/**
 * Enables or disables all zero-configuration MCPs for the current user.
 */
export function useSetZeroConfigMcpsEnabled(): readonly [
  (input: SetZeroConfigMcpsEnabledInput) => Promise<SetZeroConfigMcpsEnabledResponse | undefined>,
  McpConfigurationMutationState,
] {
  const httpClient = useHttpClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CommonError | null>(null);

  const setZeroConfigEnabled = useCallback(
    async (
      input: SetZeroConfigMcpsEnabledInput,
    ): Promise<SetZeroConfigMcpsEnabledResponse | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response = await httpClient.patch<
          SetZeroConfigMcpsEnabledBody,
          SetZeroConfigMcpsEnabledResponse
        >({
          path: '/mcps/zero-config/enabled',
          body: { enabled: input.enabled },
          withAuth: true,
        });

        return response;
      } catch (err) {
        return handleMcpMutationError({
          err,
          setError,
          defaultMessage: 'Failed to update MCP connections. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    },
    [httpClient],
  );

  return [setZeroConfigEnabled, { loading, error }] as const;
}
