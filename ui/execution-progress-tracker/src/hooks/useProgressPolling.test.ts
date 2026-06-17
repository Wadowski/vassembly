import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POLLING_INTERVAL_MS } from '../constants/polling';
import { useProgressPolling } from './useProgressPolling';

const mockStartPolling = vi.fn();
const mockStopPolling = vi.fn();
const mockRefetch = vi.fn().mockResolvedValue({});

interface RawTaskProgressQueryData {
  taskProgress: {
    id: string;
    taskId: string;
    startedAt: string;
    completedAt: string | null;
    totalDuration: number;
    totalTokens: {
      input: number;
      output: number;
      total: number;
    };
    events: [];
  };
}

const createRawTaskProgress = ({
  completedAt = null,
}: {
  completedAt?: string | null;
} = {}): RawTaskProgressQueryData => ({
  taskProgress: {
    id: 'progress-1',
    taskId: 'task-1',
    startedAt: '2026-06-15T10:00:00.000Z',
    completedAt,
    totalDuration: 1000,
    totalTokens: { input: 10, output: 20, total: 30 },
    events: [],
  },
});

const queryResult = {
  data: createRawTaskProgress() as RawTaskProgressQueryData | undefined,
  error: undefined as Error | undefined,
  loading: false,
};

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>();

  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: queryResult.data,
      error: queryResult.error,
      loading: queryResult.loading,
      refetch: mockRefetch,
      startPolling: mockStartPolling,
      stopPolling: mockStopPolling,
    })),
  };
});

describe('useProgressPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResult.data = createRawTaskProgress();
    queryResult.error = undefined;
    queryResult.loading = false;
    mockRefetch.mockResolvedValue({});
  });

  it('should start polling on mount when enabled is true and completedAt is null', () => {
    renderHook(() => useProgressPolling({ taskId: 'task-1', enabled: true }));

    expect(mockStartPolling).toHaveBeenCalledWith(POLLING_INTERVAL_MS);
  });

  it('should stop polling when completedAt is set', () => {
    queryResult.data = createRawTaskProgress({ completedAt: null });

    const { rerender } = renderHook(
      ({ enabled }) => useProgressPolling({ taskId: 'task-1', enabled }),
      { initialProps: { enabled: true } },
    );

    mockStopPolling.mockClear();
    mockStartPolling.mockClear();

    queryResult.data = createRawTaskProgress({
      completedAt: '2026-06-15T11:00:00.000Z',
    });

    rerender({ enabled: true });

    expect(mockStopPolling).toHaveBeenCalled();
    expect(mockStartPolling).not.toHaveBeenCalled();
  });

  it('should stop polling when enabled transitions from true to false', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useProgressPolling({ taskId: 'task-1', enabled }),
      { initialProps: { enabled: true } },
    );

    mockStopPolling.mockClear();

    rerender({ enabled: false });

    expect(mockStopPolling).toHaveBeenCalled();
  });

  it('should restart polling and refetch when enabled transitions from false to true on resume', () => {
    queryResult.data = createRawTaskProgress({ completedAt: null });

    const { rerender } = renderHook(
      ({ enabled }) => useProgressPolling({ taskId: 'task-1', enabled }),
      { initialProps: { enabled: false } },
    );

    expect(mockStartPolling).not.toHaveBeenCalled();

    mockStartPolling.mockClear();
    mockStopPolling.mockClear();
    mockRefetch.mockClear();

    rerender({ enabled: true });

    expect(mockStartPolling).toHaveBeenCalledWith(POLLING_INTERVAL_MS);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should restart polling when enabled transitions from false to true even with stale completedAt on retry', () => {
    queryResult.data = createRawTaskProgress({
      completedAt: '2026-06-15T09:00:00.000Z',
    });

    const { rerender } = renderHook(
      ({ enabled }) => useProgressPolling({ taskId: 'task-1', enabled }),
      { initialProps: { enabled: false } },
    );

    expect(mockStartPolling).not.toHaveBeenCalled();

    mockStartPolling.mockClear();
    mockStopPolling.mockClear();

    rerender({ enabled: true });

    expect(mockStartPolling).toHaveBeenCalledWith(POLLING_INTERVAL_MS);
  });

  it('should stop polling on unmount cleanup', () => {
    const { unmount } = renderHook(() =>
      useProgressPolling({ taskId: 'task-1', enabled: true }),
    );

    mockStopPolling.mockClear();

    unmount();

    expect(mockStopPolling).toHaveBeenCalled();
  });

  it('should handle rapid enable and disable transitions without leaking polling', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useProgressPolling({ taskId: 'task-1', enabled }),
      { initialProps: { enabled: true } },
    );

    act(() => {
      rerender({ enabled: false });
    });

    act(() => {
      rerender({ enabled: true });
    });

    act(() => {
      rerender({ enabled: false });
    });

    expect(mockStartPolling).toHaveBeenCalled();
    expect(mockStopPolling).toHaveBeenCalled();

    const lastStopIndex = mockStopPolling.mock.invocationCallOrder.at(-1) ?? -1;
    const lastStartIndex = mockStartPolling.mock.invocationCallOrder.at(-1) ?? -1;

    expect(lastStopIndex).toBeGreaterThan(lastStartIndex);

    const startsAfterFinalStop = mockStartPolling.mock.invocationCallOrder.filter(
      (callOrder) => callOrder > lastStopIndex,
    );

    expect(startsAfterFinalStop).toHaveLength(0);
  });
});
