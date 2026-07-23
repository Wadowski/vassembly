import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskStatus, TaskType, type UserTasksListResponse } from './types';
import { useUserTasks } from './useUserTasks';

const hoisted = vi.hoisted(() => ({
  execute: vi.fn(),
  capturedOptions: undefined as Record<string, unknown> | undefined,
  data: undefined as
    | {
        userTasks?: {
          items?: Array<{
            id: string;
            userId: string;
            description: string;
            type: string;
            status: string;
            agentAssignedId: string | null;
            title: string | null;
            createdAt: string;
            updatedAt: string;
          }>;
          totalCount: number;
          page: number;
          size: number;
        };
      }
    | undefined,
  isLoading: false,
  error: undefined as { message: string } | undefined,
}));

vi.mock('../graphql/useApolloLazyQuery', () => ({
  useApolloLazyQuery: (_query: unknown, options: Record<string, unknown>) => {
    hoisted.capturedOptions = options;
    return {
      execute: hoisted.execute,
      data: hoisted.data,
      isLoading: hoisted.isLoading,
      error: hoisted.error,
    };
  },
}));

describe('useUserTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.data = undefined;
    hoisted.isLoading = false;
    hoisted.error = undefined;
    hoisted.capturedOptions = undefined;
  });

  describe('success flows', () => {
    it('should return data isLoading error and fetch from the hook', () => {
      const { result } = renderHook(() => useUserTasks());

      expect(result.current).toEqual(
        expect.objectContaining({
          data: undefined,
          isLoading: false,
          error: undefined,
          fetch: expect.any(Function),
        }),
      );
    });

    it('should configure Apollo lazy query with no-cache and withAuth', () => {
      renderHook(() => useUserTasks());

      expect(hoisted.capturedOptions).toEqual(
        expect.objectContaining({
          fetchPolicy: 'no-cache',
          withAuth: true,
        }),
      );
    });

    it('should map GraphQL userTasks payloads when fetch resolves', async () => {
      const graphQLPayload = {
        userTasks: {
          items: [
            {
              id: 'task-1',
              userId: 'user-1',
              description: 'Review quarterly report',
              type: 'user',
              status: TaskStatus.Created,
              agentAssignedId: null,
              title: null,
              createdAt: '2026-05-26T12:00:00.000Z',
              updatedAt: '2026-05-26T12:00:00.000Z',
            },
          ],
          totalCount: 1,
          page: 0,
          size: 10,
        },
      };

      const mapped: UserTasksListResponse = {
        items: [
          {
            id: 'task-1',
            userId: 'user-1',
            description: 'Review quarterly report',
            type: TaskType.User,
            status: TaskStatus.Created,
            agentAssignedId: null,
            title: null,
            activeCommentId: null,
            errorMessage: null,
            errorCode: null,
            startedAt: null,
            completedAt: null,
            failedAt: null,
            pausedAt: null,
            createdAt: '2026-05-26T12:00:00.000Z',
            updatedAt: '2026-05-26T12:00:00.000Z',
            specializationIds: null,
            skillIdsUsed: null,
          },
        ],
        totalCount: 1,
        page: 0,
        size: 10,
      };

      hoisted.execute.mockResolvedValue({ data: graphQLPayload });
      hoisted.data = graphQLPayload;

      const { result } = renderHook(() => useUserTasks());

      let fetchResult: UserTasksListResponse | undefined;
      await act(async () => {
        fetchResult = await result.current.fetch({ query: { page: 0, size: 10 } });
      });

      expect(fetchResult).toEqual(mapped);
      await waitFor(() => {
        expect(result.current.data).toEqual(mapped);
      });
    });

    it('should expose loading state while fetch is in progress', async () => {
      hoisted.isLoading = true;

      const { result } = renderHook(() => useUserTasks());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('error flows', () => {
    it('should expose GraphQL errors in the error field', () => {
      const graphQLError = { message: 'GraphQL request failed' };
      hoisted.error = graphQLError;

      const { result } = renderHook(() => useUserTasks());

      expect(result.current.error).toEqual(graphQLError);
      expect(result.current.data).toBeUndefined();
    });

    it('should return undefined data when fetch rejects with network failure', async () => {
      hoisted.execute.mockRejectedValue(new Error('Network failure'));

      const { result } = renderHook(() => useUserTasks());

      await expect(result.current.fetch({ query: { page: 0, size: 10 } })).rejects.toThrow(
        'Network failure',
      );
    });
  });
});
