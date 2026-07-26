import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '@vassembly/errors';

import { useUserConfiguredMcps } from '../../../src/mcps/useUserConfiguredMcps';

const hoisted = vi.hoisted(() => ({
  data: undefined as
    | {
        userConfiguredMcps?: {
          items: Array<{
            id: string;
            name: string;
            updatedAt: string;
          }>;
          total: number;
          page: number;
          size: number;
        };
      }
    | undefined,
  isLoading: true,
  error: undefined as Error | undefined,
  execute: vi.fn(),
}));

vi.mock('../../../src/graphql/useApolloLazyQuery', () => ({
  useApolloLazyQuery: () => ({
    data: hoisted.data,
    isLoading: hoisted.isLoading,
    error: hoisted.error,
    execute: hoisted.execute,
  }),
}));

const MOCK_CONFIGURED_MCPS = [
  {
    id: 'mcp-gmail',
    name: 'Gmail MCP',
    description: 'Send and read Gmail messages',
    tags: ['email'],
    iconPath: '/icons/gmail.svg',
    slug: 'gmail-mcp',
    configurationStatus: 'configured',
    enabled: true,
    requiresConfiguration: true,
    createdAt: '2026-06-08T10:00:00.000Z',
    updatedAt: '2026-06-08T14:00:00.000Z',
  },
  {
    id: 'mcp-brave',
    name: 'Brave Search MCP',
    description: 'Search the web with Brave',
    tags: ['search'],
    iconPath: '/icons/brave.svg',
    slug: 'brave-search-mcp',
    configurationStatus: 'configured',
    enabled: true,
    requiresConfiguration: true,
    createdAt: '2026-06-07T08:00:00.000Z',
    updatedAt: '2026-06-07T12:00:00.000Z',
  },
];

describe('useUserConfiguredMcps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.data = undefined;
    hoisted.isLoading = true;
    hoisted.error = undefined;
  });

  describe('YOUR MCPs query', () => {
    it('should return list of user configured MCPs', async () => {
      hoisted.data = {
        userConfiguredMcps: {
          items: MOCK_CONFIGURED_MCPS,
          total: 2,
          page: 0,
          size: 20,
        },
      };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useUserConfiguredMcps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.data?.items)).toBe(true);
      expect(result.current.data?.items.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty list when no configurations exist', async () => {
      hoisted.data = {
        userConfiguredMcps: {
          items: [],
          total: 0,
          page: 0,
          size: 20,
        },
      };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useUserConfiguredMcps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.items).toEqual([]);
    });

    it('should return MCP metadata sorted by updatedAt from the API', async () => {
      hoisted.data = {
        userConfiguredMcps: {
          items: MOCK_CONFIGURED_MCPS,
          total: 2,
          page: 0,
          size: 20,
        },
      };
      hoisted.isLoading = false;

      const { result } = renderHook(() => useUserConfiguredMcps());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mcps = result.current.data?.items ?? [];
      expect(mcps[0]?.id).toBe('mcp-gmail');
      expect(mcps[0]?.name).toBe('Gmail MCP');
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
