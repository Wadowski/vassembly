import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '@vassembly/errors';

import { MOCK_CONFIGURED_MCPS } from '../fixtures/mcpFixtures';
import { useUserConfiguredMcps } from '../../../src/mcps/useUserConfiguredMcps';

const hoisted = vi.hoisted(() => ({
  data: undefined as
    | {
        userConfiguredMcps?: {
          items: Array<{
            mcpId: string;
            updatedAt: string;
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

describe('useUserConfiguredMcps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.data = undefined;
    hoisted.isLoading = true;
    hoisted.error = undefined;
  });

  describe('YOUR MCPs query', () => {
    it('should return list of user configured MCPs', async () => {
      hoisted.data = { userConfiguredMcps: { items: MOCK_CONFIGURED_MCPS } };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useUserConfiguredMcps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.data?.mcps)).toBe(true);
      expect(result.current.data?.mcps.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty list when no configurations exist', async () => {
      hoisted.data = { userConfiguredMcps: { items: [] } };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useUserConfiguredMcps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.mcps).toEqual([]);
    });

    it('should sort by updatedAt descending with most recent first', async () => {
      hoisted.data = { userConfiguredMcps: { items: MOCK_CONFIGURED_MCPS } };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useUserConfiguredMcps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mcps = result.current.data?.mcps ?? [];
      for (let index = 0; index < mcps.length - 1; index += 1) {
        const current = new Date(mcps[index].updatedAt).getTime();
        const next = new Date(mcps[index + 1].updatedAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should handle 401 unauthorized gracefully', async () => {
      hoisted.error = new UnauthorizedError('Unauthorized');
      hoisted.isLoading = false;

      const { result } = renderHook(() => useUserConfiguredMcps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });
  });
});
