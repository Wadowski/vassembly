import { CommonError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../http/useHttpClient';

import { handleMcpMutationError } from './handleMcpMutationError';
import type { DeleteConfigInput, McpConfigurationMutationState } from './types';

interface DeleteMcpConfigurationResponse {
  success: boolean;
}

/**
 * Deletes the current user's MCP configuration.
 */
export function useDeleteMcpConfiguration(): readonly [
  (input: DeleteConfigInput) => Promise<DeleteMcpConfigurationResponse | undefined>,
  McpConfigurationMutationState,
] {
  const httpClient = useHttpClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CommonError | null>(null);

  const deleteConfig = useCallback(
    async (input: DeleteConfigInput): Promise<DeleteMcpConfigurationResponse | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response = await httpClient.delete<DeleteMcpConfigurationResponse>({
          path: `/mcps/${input.mcpId}/configuration`,
          withAuth: true,
        });

        return response;
      } catch (err) {
        return handleMcpMutationError({
          err,
          setError,
          defaultMessage: 'Failed to delete configuration',
        });
      } finally {
        setLoading(false);
      }
    },
    [httpClient],
  );

  return [deleteConfig, { loading, error }] as const;
}
