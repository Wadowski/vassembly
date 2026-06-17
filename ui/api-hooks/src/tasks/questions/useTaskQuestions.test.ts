import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET_TASK_QUESTIONS_QUERY } from './graphql/getTaskQuestionsQuery';
import { TaskStatus } from '../types';
import { TASK_QUESTIONS_POLL_INTERVAL_MS } from '../isTaskDetailPollable';
import { useTaskQuestions } from './useTaskQuestions';

const hoisted = vi.hoisted(() => ({
  capturedQuery: undefined as string | undefined,
  capturedOptions: undefined as Record<string, unknown> | undefined,
  data: undefined as
    | {
        taskQuestions?: {
          taskId: string;
          pendingQuestions: [];
          answeredQuestions: [];
        } | null;
      }
    | undefined,
  isLoading: false,
  error: undefined,
  refetch: vi.fn(),
}));

vi.mock('../../graphql/useApolloQuery', () => ({
  useApolloQuery: (query: string, options: Record<string, unknown>) => {
    hoisted.capturedQuery = query;
    hoisted.capturedOptions = options;
    return {
      data: hoisted.data,
      isLoading: hoisted.isLoading,
      error: hoisted.error,
      refetch: hoisted.refetch,
    };
  },
}));

describe('useTaskQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.data = undefined;
    hoisted.isLoading = false;
    hoisted.error = undefined;
    hoisted.capturedQuery = undefined;
    hoisted.capturedOptions = undefined;
  });

  it('should configure GraphQL query with polling when task is in-progress', () => {
    renderHook(() =>
      useTaskQuestions({ taskId: 'task-1', taskStatus: TaskStatus.InProgress }),
    );

    expect(hoisted.capturedQuery).toBe(GET_TASK_QUESTIONS_QUERY);
    expect(hoisted.capturedOptions).toEqual(
      expect.objectContaining({
        variables: { taskId: 'task-1' },
        fetchPolicy: 'network-only',
        pollInterval: TASK_QUESTIONS_POLL_INTERVAL_MS,
        withAuth: true,
        skip: false,
      }),
    );
  });

  it('should poll when task status is waiting', () => {
    renderHook(() => useTaskQuestions({ taskId: 'task-1', taskStatus: TaskStatus.Waiting }));

    expect(hoisted.capturedOptions).toEqual(
      expect.objectContaining({
        pollInterval: TASK_QUESTIONS_POLL_INTERVAL_MS,
      }),
    );
  });

  it('should disable polling when task is not in-progress or waiting', () => {
    renderHook(() => useTaskQuestions({ taskId: 'task-1', taskStatus: TaskStatus.Done }));

    expect(hoisted.capturedOptions).toEqual(
      expect.objectContaining({
        pollInterval: 0,
      }),
    );
  });

  it('should skip query when taskId is empty', () => {
    renderHook(() => useTaskQuestions({ taskId: '', taskStatus: TaskStatus.InProgress }));

    expect(hoisted.capturedOptions).toEqual(
      expect.objectContaining({
        skip: true,
      }),
    );
  });
});
