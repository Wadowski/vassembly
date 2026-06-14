import { CommonError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../http/useHttpClient';

import { handleMcpMutationError } from './handleMcpMutationError';
import type {
  McpConfigurationMutationState,
  SaveConfigInput,
  SaveMcpConfigurationResponse,
} from './types';

interface SaveMcpConfigurationBody {
  fieldValues: Record<string, string | boolean>;
}

/**
 * Creates a new MCP configuration for the current user.
 */
export function useSaveMcpConfiguration(): readonly [
  (input: SaveConfigInput) => Promise<SaveMcpConfigurationResponse | undefined>,
  McpConfigurationMutationState,
] {
  const httpClient = useHttpClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CommonError | null>(null);

  const save = useCallback(
    async (input: SaveConfigInput): Promise<SaveMcpConfigurationResponse | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response = await httpClient.post<SaveMcpConfigurationBody, SaveMcpConfigurationResponse>({
          path: `/mcps/${input.mcpId}/configuration`,
          body: { fieldValues: input.fieldValues },
          withAuth: true,
        });

        return response;
      } catch (err) {
        return handleMcpMutationError({
          err,
          setError,
          defaultMessage: 'Failed to save configuration',
        });
      } finally {
        setLoading(false);
      }
    },
    [httpClient],
  );

  return [save, { loading, error }] as const;
}
