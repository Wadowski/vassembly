import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentCategory, AgentStatus, type AgentsListResponse } from './types';
import { useAgents } from './useAgents';

const hoisted = vi.hoisted(() => ({
  execute: vi.fn(),
  data: undefined as
    | {
        agents?: {
          items?: Array<{
            id: string;
            name: string;
            category: string;
            description: string;
            rule: string;
            userId: string;
            status: string;
            integrationCredentialId: string | null;
            createdAt: string;
            updatedAt: string;
            removedAt: string | null;
          }>;
          totalCount: number;
          page: number;
          size: number;
        };
      }
    | undefined,
  isLoading: false,
  error: undefined,
}));

vi.mock('../graphql/useApolloLazyQuery', () => ({
  useApolloLazyQuery: () => ({
    execute: hoisted.execute,
    data: hoisted.data,
    isLoading: hoisted.isLoading,
    error: hoisted.error,
  }),
}));

describe('useAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.data = undefined;
    hoisted.isLoading = false;
    hoisted.error = undefined;
  });

  it('should load paginated catalog payloads returned by the agents GraphQL query', async () => {
    const graphQLPayload = {
      agents: {
        items: [
          {
            id: 'a1',
            name: 'Planner',
            category: AgentCategory.Coding,
            description: 'Plans tasks',
            rule: 'Organize',
            userId: 'user-1',
            status: AgentStatus.Active,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
            removedAt: null,
            integrationCredentialId: null,
            assignedMcpIds: [],
            assignedToolIds: [],
          },
        ],
        totalCount: 1,
        page: 0,
        size: 10,
      },
    };

    const mapped: AgentsListResponse = {
      items: [
        {
          id: 'a1',
          name: 'Planner',
          category: AgentCategory.Coding,
          description: 'Plans tasks',
          rule: 'Organize',
          userId: 'user-1',
          status: AgentStatus.Active,
          integrationCredentialId: null,
          assignedMcpIds: [],
          assignedToolIds: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          removedAt: null,
        },
      ],
      totalCount: 1,
      page: 0,
      size: 10,
    };

    hoisted.execute.mockResolvedValue({ data: graphQLPayload });
    hoisted.data = graphQLPayload;

    const { result } = renderHook(() => useAgents());

    await act(async () => {
      await result.current.fetch({
        query: { page: 0, size: 10, status: AgentStatus.Active },
      });
    });

    await waitFor(() => {
      expect(result.current.data?.totalCount).toBe(1);
      expect(result.current.data?.items[0]?.name).toBe('Planner');
      expect(result.current.data).toEqual(mapped);
    });
  });

  it('should return mapped empty catalog payloads when GraphQL responses are delayed', async () => {
    hoisted.execute.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            const payload = {
              agents: {
                items: [],
                totalCount: 0,
                page: 0,
                size: 10,
              },
            };
            hoisted.data = payload;
            resolve({ data: payload });
          }, 20);
        }),
    );

    const { result, rerender } = renderHook(() => useAgents());

    let fetchResult: AgentsListResponse | undefined;
    await act(async () => {
      fetchResult = await result.current.fetch({ query: { page: 0, size: 10 } });
    });

    rerender();

    expect(fetchResult?.totalCount).toBe(0);
    await waitFor(() => {
      expect(result.current.data?.totalCount).toBe(0);
    });
  });

  it('should expose errors returned by GraphQL without swallowing them', async () => {
    const graphQLError = { message: 'network failure' };
    hoisted.error = graphQLError as never;

    const { result } = renderHook(() => useAgents());

    expect(result.current.error).toBe(graphQLError);
    expect(result.current.data).toBeUndefined();
  });
});
