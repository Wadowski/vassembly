import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '@vassembly/errors';

import { MOCK_MCP_GMAIL } from '../fixtures/mcpFixtures';
import { useMcp } from '../../../src/mcps/useMcp';

const hoisted = vi.hoisted(() => ({
  data: undefined as
    | {
        mcp?: {
          id: string;
          configSchema?: { fields: unknown[] };
          configurationStatus?: string;
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

describe('useMcp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.data = undefined;
    hoisted.isLoading = true;
    hoisted.error = undefined;
  });

  describe('single MCP query', () => {
    it('should fetch MCP by id with configSchema', async () => {
      hoisted.data = { mcp: MOCK_MCP_GMAIL };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcp('mcp-gmail'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.mcp?.id).toBe('mcp-gmail');
      expect(result.current.data?.mcp?.configSchema).toBeDefined();
      expect(result.current.data?.mcp?.configSchema?.fields).toBeInstanceOf(Array);
    });

    it('should return null when MCP not found', async () => {
      hoisted.data = { mcp: null };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcp('mcp-nonexistent'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.mcp).toBeNull();
    });

    it('should include configurationStatus', async () => {
      hoisted.data = { mcp: MOCK_MCP_GMAIL };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcp('mcp-gmail'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(['configured', 'pending']).toContain(
        result.current.data?.mcp?.configurationStatus,
      );
    });

    it('should handle 401 unauthorized gracefully', async () => {
      hoisted.error = new UnauthorizedError('Authentication required');
      hoisted.isLoading = false;

      const { result } = renderHook(() => useMcp('mcp-gmail'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });
  });
});
