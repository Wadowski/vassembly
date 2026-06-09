import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '@vassembly/errors';

import { MOCK_MASKED_CONFIGURATION } from '../fixtures/mcpFixtures';
import { useMcpConfiguration } from '../../../src/mcps/useMcpConfiguration';

const hoisted = vi.hoisted(() => ({
  data: undefined as
    | {
        mcpConfiguration?: {
          mcpId: string;
          fieldValues?: Array<{
            key: string;
            value?: string | boolean;
            hasSecret?: boolean;
          }>;
        } | null;
      }
    | undefined,
  isLoading: true,
  error: undefined as Error | undefined,
  refetch: vi.fn(),
}));

vi.mock('../../../src/graphql/useApolloQuery', () => ({
  useApolloQuery: () => ({
    data: hoisted.data,
    isLoading: hoisted.isLoading,
    error: hoisted.error,
    refetch: hoisted.refetch,
  }),
}));

describe('useMcpConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.data = undefined;
    hoisted.isLoading = true;
    hoisted.error = undefined;
  });

  describe('user config query', () => {
    it('should fetch user config for MCP', async () => {
      hoisted.data = { mcpConfiguration: MOCK_MASKED_CONFIGURATION };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcpConfiguration('mcp-gmail'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.configuration).toBeDefined();
      expect(result.current.data?.configuration?.mcpId).toBe('mcp-gmail');
    });

    it('should return null when not configured', async () => {
      hoisted.data = { mcpConfiguration: null };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcpConfiguration('mcp-unconfigured'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.configuration).toBeNull();
    });

    it('should mask password fields with no plaintext secrets', async () => {
      hoisted.data = { mcpConfiguration: MOCK_MASKED_CONFIGURATION };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcpConfiguration('mcp-gmail'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const config = result.current.data?.configuration;
      if (config?.fieldValues) {
        config.fieldValues.forEach((fieldValue) => {
          if (fieldValue.hasSecret) {
            expect(fieldValue.value).toBeUndefined();
          }
        });
      }
    });

    it('should handle 401 unauthorized gracefully', async () => {
      hoisted.error = new UnauthorizedError('Unauthorized');
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcpConfiguration('mcp-gmail'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });
  });
});
