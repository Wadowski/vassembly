import { CommonError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../http/useHttpClient';

import { handleMcpMutationError } from './handleMcpMutationError';
import type {
  McpConfigurationMutationState,
  TestConnectionInput,
  TestConnectionResult,
} from './types';

interface TestMcpConnectionBody {
  fieldValues: Record<string, string | boolean>;
  useSavedSecrets: boolean;
}

interface TestMcpConnectionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Tests MCP connectivity using provided or saved configuration values.
 */
export function useTestMcpConnection(): readonly [
  (input: TestConnectionInput) => Promise<TestConnectionResult | undefined>,
  McpConfigurationMutationState,
] {
  const httpClient = useHttpClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CommonError | null>(null);

  const test = useCallback(
    async (input: TestConnectionInput): Promise<TestConnectionResult | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response = await httpClient.post<TestMcpConnectionBody, TestMcpConnectionResponse>({
          path: `/mcps/${input.mcpId}/configuration/test`,
          body: {
            fieldValues: input.fieldValues,
            useSavedSecrets: input.useSavedSecrets ?? false,
          },
          withAuth: true,
        });

        return {
          success: response.success,
          error: response.error,
        };
      } catch (err) {
        return handleMcpMutationError({
          err,
          setError,
          defaultMessage: 'Test connection failed',
        });
      } finally {
        setLoading(false);
      }
    },
    [httpClient],
  );

  return [test, { loading, error }] as const;
}
