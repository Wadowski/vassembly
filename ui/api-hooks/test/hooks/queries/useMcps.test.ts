import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '@vassembly/errors';

import { MOCK_MCP_BRAVE, MOCK_MCP_GMAIL } from '../fixtures/mcpFixtures';
import { useMcps } from '../../../src/mcps/useMcps';

const hoisted = vi.hoisted(() => ({
  data: undefined as
    | {
        mcps?: {
          items: Array<{
            id: string;
            configurationStatus?: string;
          }>;
        };
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

describe('useMcps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.data = undefined;
    hoisted.isLoading = true;
    hoisted.error = undefined;
  });

  describe('query', () => {
    it('should fetch all MCPs with configurationStatus', async () => {
      hoisted.data = {
        mcps: {
          items: [MOCK_MCP_GMAIL, MOCK_MCP_BRAVE],
        },
      };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.mcps).toBeDefined();
      expect(result.current.data?.mcps.length).toBeGreaterThan(0);

      const mcps = result.current.data?.mcps ?? [];
      mcps.forEach((mcp) => {
        expect(['configured', 'pending']).toContain(mcp.configurationStatus);
      });
    });

    it('should return loading state initially', () => {
      hoisted.isLoading = true;

      const { result } = renderHook(() => useMcps());

      expect(result.current.loading).toBe(true);
    });

    it('should handle error gracefully', async () => {
      hoisted.error = new Error('GraphQL request failed');
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle 401 unauthorized gracefully', async () => {
      hoisted.error = new UnauthorizedError('Authentication required');
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('refetch', () => {
    it('should provide refetch function', async () => {
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcps());

      expect(result.current.refetch).toBeDefined();
      expect(typeof result.current.refetch).toBe('function');
    });
  });
});
