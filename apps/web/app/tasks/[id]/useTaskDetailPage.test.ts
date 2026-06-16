import { NotFoundError } from '@vassembly/errors';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskStatus, TaskType, type TaskDto } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';

import { TASK_LOAD_ERROR_FALLBACK, TASK_NOT_FOUND_MESSAGE } from './constants';
import { useTaskDetailPage } from './useTaskDetailPage';

const mockFetch = vi.fn();
const mockShowSnackbar = vi.fn();
const mockUseParams = vi.fn((): Record<string, string | string[]> => ({ id: 'task-1' }));

vi.mock('next/navigation', () => ({
  useParams: (): Record<string, string | string[]> => mockUseParams(),
}));

vi.mock('@vassembly/ui-api-hooks', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@vassembly/ui-api-hooks')>();
  return {
    ...mod,
    useTaskDetail: vi.fn(() => ({
      data: undefined,
      isLoading: false,
      error: undefined,
      fetch: mockFetch,
    })),
  };
});

const buildTask = (partial: Partial<TaskDto> = {}): TaskDto => ({
  id: partial.id ?? 'task-1',
  userId: partial.userId ?? 'user-1',
  description: partial.description ?? 'Review quarterly report',
  type: partial.type ?? TaskType.User,
  status: partial.status ?? TaskStatus.InProgress,
  agentAssignedId: partial.agentAssignedId ?? null,
  title: partial.title ?? 'Quarterly review',
  llmResponse: partial.llmResponse ?? null,
  errorMessage: partial.errorMessage ?? null,
  errorCode: partial.errorCode ?? null,
  startedAt: partial.startedAt ?? '2026-03-12T15:46:00.000Z',
  completedAt: partial.completedAt ?? null,
  failedAt: partial.failedAt ?? null,
  pausedAt: partial.pausedAt ?? null,
  createdAt: partial.createdAt ?? '2026-03-12T15:45:00.000Z',
  updatedAt: partial.updatedAt ?? '2026-03-12T16:10:00.000Z',
});

describe('useTaskDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Vassembly';
    mockUseParams.mockReturnValue({ id: 'task-1' });
    vi.mocked(useSnackbar).mockReturnValue({
      show: mockShowSnackbar,
      dismiss: vi.fn(),
    });
    mockFetch.mockResolvedValue(buildTask());
  });

  it('should expose loading phase while task fetch is in flight', () => {
    mockFetch.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useTaskDetailPage());

    expect(result.current.view.phase).toBe('loading');
    expect(result.current.loginRoute).toBe('/login?returnUrl=%2Ftasks%2Ftask-1');
  });

  it('should expose ready phase when task fetch succeeds', async () => {
    const task = buildTask({ title: 'Invoice review' });
    mockFetch.mockResolvedValue(task);

    const { result } = renderHook(() => useTaskDetailPage());

    await waitFor(() => {
      expect(result.current.view.phase).toBe('ready');
    });

    if (result.current.view.phase !== 'ready') {
      throw new Error('Expected ready phase');
    }

    expect(result.current.view.task).toEqual(task);
    expect(document.title).toBe('Invoice review · Tasks');
  });

  it('should expose notFound phase when fetch rejects with NotFoundError', async () => {
    mockFetch.mockRejectedValue(new NotFoundError(TASK_NOT_FOUND_MESSAGE));

    const { result } = renderHook(() => useTaskDetailPage());

    await waitFor(() => {
      expect(result.current.view.phase).toBe('notFound');
    });
  });

  it('should expose error phase and show snackbar when fetch fails unexpectedly', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useTaskDetailPage());

    await waitFor(() => {
      expect(result.current.view.phase).toBe('error');
    });

    if (result.current.view.phase !== 'error') {
      throw new Error('Expected error phase');
    }

    expect(result.current.view.message).toBe('Network failure');
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'error',
        message: 'Network failure',
      }),
    );
  });

  it('should ignore stale fetch results after route param changes', async () => {
    let resolveFirstFetch: ((task: TaskDto) => void) | undefined;
    const firstFetch = new Promise<TaskDto>((resolve) => {
      resolveFirstFetch = resolve;
    });

    mockFetch.mockReturnValueOnce(firstFetch).mockResolvedValueOnce(buildTask({ id: 'task-2' }));

    const { result, rerender } = renderHook(() => useTaskDetailPage());

    mockUseParams.mockReturnValue({ id: 'task-2' });
    rerender();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(result.current.view.phase).toBe('ready');
    });

    if (result.current.view.phase !== 'ready') {
      throw new Error('Expected ready phase');
    }

    expect(result.current.view.task.id).toBe('task-2');

    resolveFirstFetch?.(buildTask({ id: 'task-1', title: 'Stale task' }));

    await act(async () => {
      await Promise.resolve();
    });

    if (result.current.view.phase !== 'ready') {
      throw new Error('Expected ready phase after stale resolution');
    }

    expect(result.current.view.task.id).toBe('task-2');
  });

  it('should retry fetch when error phase onRetry is invoked', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure')).mockResolvedValueOnce(buildTask());

    const { result } = renderHook(() => useTaskDetailPage());

    await waitFor(() => {
      expect(result.current.view.phase).toBe('error');
    });

    if (result.current.view.phase !== 'error') {
      throw new Error('Expected error phase');
    }

    await act(async () => {
      if (result.current.view.phase !== 'error') {
        throw new Error('Expected error phase');
      }
      result.current.view.onRetry();
    });

    await waitFor(() => {
      expect(result.current.view.phase).toBe('ready');
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should expose notFound phase when route id param is missing', async () => {
    mockUseParams.mockReturnValue({});
    mockFetch.mockClear();

    const { result } = renderHook(() => useTaskDetailPage());

    await waitFor(() => {
      expect(result.current.view.phase).toBe('notFound');
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.loginRoute).toBe('/login?returnUrl=%2F');
  });

  it('should use fallback error message when fetch rejects without message', async () => {
    mockFetch.mockRejectedValue(null);

    const { result } = renderHook(() => useTaskDetailPage());

    await waitFor(() => {
      expect(result.current.view.phase).toBe('error');
    });

    if (result.current.view.phase !== 'error') {
      throw new Error('Expected error phase');
    }

    expect(result.current.view.message).toBe(TASK_LOAD_ERROR_FALLBACK);
  });

  it('should poll task every 3 seconds while status is in-progress', async () => {
    vi.useFakeTimers();

    try {
      const inProgressTask = buildTask({ status: TaskStatus.InProgress });
      const doneTask = buildTask({ status: TaskStatus.Done, llmResponse: 'Done output' });
      mockFetch.mockResolvedValueOnce(inProgressTask).mockResolvedValue(doneTask);

      const { result } = renderHook(() => useTaskDetailPage());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.view.phase).toBe('ready');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);

      if (result.current.view.phase === 'ready') {
        expect(result.current.view.task.status).toBe(TaskStatus.Done);
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('should stop polling when task reaches terminal status', async () => {
    vi.useFakeTimers();

    try {
      mockFetch.mockResolvedValue(buildTask({ status: TaskStatus.Done, llmResponse: 'result' }));

      renderHook(() => useTaskDetailPage());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(9000);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
