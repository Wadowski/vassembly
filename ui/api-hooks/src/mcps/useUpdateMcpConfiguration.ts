import { CommonError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../http/useHttpClient';

import { handleMcpMutationError } from './handleMcpMutationError';
import type {
  McpConfigurationMutationState,
  SaveMcpConfigurationResponse,
  UpdateConfigInput,
} from './types';

interface UpdateMcpConfigurationBody {
  fieldValues: Record<string, string | boolean>;
}

/**
 * Updates an existing MCP configuration with partial field values.
 */
export function useUpdateMcpConfiguration(): readonly [
  (input: UpdateConfigInput) => Promise<SaveMcpConfigurationResponse | undefined>,
  McpConfigurationMutationState,
] {
  const httpClient = useHttpClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CommonError | null>(null);

  const update = useCallback(
    async (input: UpdateConfigInput): Promise<SaveMcpConfigurationResponse | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response = await httpClient.patch<UpdateMcpConfigurationBody, SaveMcpConfigurationResponse>({
          path: `/mcps/${input.mcpId}/configuration`,
          body: { fieldValues: input.fieldValues },
          withAuth: true,
        });

        return response;
      } catch (err) {
        return handleMcpMutationError({
          err,
          setError,
          defaultMessage: 'Failed to update configuration',
        });
      } finally {
        setLoading(false);
      }
    },
    [httpClient],
  );

  return [update, { loading, error }] as const;
}
