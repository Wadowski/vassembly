import { act, renderHook, waitFor } from '@testing-library/react';
import { NotFoundError } from '@vassembly/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET_TASK_QUERY } from './graphql/getTaskQuery';
import { TaskStatus, TaskType, type TaskDto } from './types';
import { useTaskDetail } from './useTaskDetail';

const hoisted = vi.hoisted(() => ({
  execute: vi.fn(),
  capturedQuery: undefined as string | undefined,
  capturedOptions: undefined as Record<string, unknown> | undefined,
  data: undefined as
    | {
        task?: {
          id: string;
          userId: string;
          description: string;
          type: string;
          status: string;
          agentAssignedId: string | null;
          title: string | null;
          createdAt: string;
          updatedAt: string;
        } | null;
      }
    | undefined,
  isLoading: false,
  error: undefined as { message: string } | undefined,
}));

vi.mock('../graphql/useApolloLazyQuery', () => ({
  useApolloLazyQuery: (query: string, options: Record<string, unknown>) => {
    hoisted.capturedQuery = query;
    hoisted.capturedOptions = options;
    return {
      execute: hoisted.execute,
      data: hoisted.data,
      isLoading: hoisted.isLoading,
      error: hoisted.error,
    };
  },
}));

describe('useTaskDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.data = undefined;
    hoisted.isLoading = false;
    hoisted.error = undefined;
    hoisted.capturedQuery = undefined;
    hoisted.capturedOptions = undefined;
  });

  describe('success flows', () => {
    it('should return data isLoading error and fetch from the hook', () => {
      const { result } = renderHook(() => useTaskDetail());

      expect(result.current).toEqual(
        expect.objectContaining({
          data: undefined,
          isLoading: false,
          error: undefined,
          fetch: expect.any(Function),
        }),
      );
    });

    it('should configure Apollo lazy query with GET_TASK_QUERY no-cache and withAuth', () => {
      renderHook(() => useTaskDetail());

      expect(hoisted.capturedQuery).toBe(GET_TASK_QUERY);
      expect(hoisted.capturedOptions).toEqual(
        expect.objectContaining({
          fetchPolicy: 'no-cache',
          withAuth: true,
        }),
      );
    });

    it('should map GraphQL task payload to TaskDto when fetch resolves', async () => {
      const graphQLPayload = {
        task: {
          id: 'task-1',
          userId: 'user-1',
          description: 'Review quarterly report',
          type: 'user',
          status: TaskStatus.Created,
          agentAssignedId: null,
          title: 'Quarterly review',
          createdAt: '2026-05-26T12:00:00.000Z',
          updatedAt: '2026-05-26T12:00:00.000Z',
        },
      };

      const mapped: TaskDto = {
        id: 'task-1',
        userId: 'user-1',
        description: 'Review quarterly report',
        type: TaskType.User,
        status: TaskStatus.Created,
        agentAssignedId: null,
        title: 'Quarterly review',
        llmResponse: null,
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
      };

      hoisted.execute.mockResolvedValue({ data: graphQLPayload });
      hoisted.data = graphQLPayload;

      const { result } = renderHook(() => useTaskDetail());

      let fetchResult: TaskDto | undefined;
      await act(async () => {
        fetchResult = await result.current.fetch('task-1');
      });

      expect(fetchResult).toEqual(mapped);
      await waitFor(() => {
        expect(result.current.data).toEqual(mapped);
      });
    });

    it('should expose loading state while fetch is in progress', () => {
      hoisted.isLoading = true;

      const { result } = renderHook(() => useTaskDetail());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('error flows', () => {
    it('should expose GraphQL errors in the error field', () => {
      const graphQLError = { message: 'GraphQL request failed' };
      hoisted.error = graphQLError;

      const { result } = renderHook(() => useTaskDetail());

      expect(result.current.error).toEqual(graphQLError);
      expect(result.current.data).toBeUndefined();
    });

    it('should reject when fetch fails with network failure', async () => {
      hoisted.execute.mockRejectedValue(new Error('Network failure'));

      const { result } = renderHook(() => useTaskDetail());

      await expect(result.current.fetch('task-1')).rejects.toThrow('Network failure');
    });

    it('should reject with NotFoundError when GraphQL returns null task', async () => {
      hoisted.execute.mockResolvedValue({ data: { task: null } });

      const { result } = renderHook(() => useTaskDetail());

      await expect(result.current.fetch('task-1')).rejects.toThrow(NotFoundError);
      await expect(result.current.fetch('task-1')).rejects.toThrow('Task not found');
    });
  });
});
