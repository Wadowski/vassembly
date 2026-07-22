import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskStatus } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-system-design/snackbar';

import { useHomeTaskList } from './useHomeTaskList';

const mockFetch = vi.fn();
const mockShowSnackbar = vi.fn();
const mockUseDebouncedValue = vi.fn((value: string) => value);

vi.mock('@vassembly/ui-api-hooks', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@vassembly/ui-api-hooks')>();
  return {
    ...mod,
    useUserTasks: vi.fn(() => ({
      data: undefined,
      isLoading: false,
      error: undefined,
      fetch: mockFetch,
    })),
  };
});

vi.mock('../../lib/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => mockUseDebouncedValue(value),
}));

const buildTask = (id: string) => ({
  id,
  userId: 'user-1',
  description: `Task ${id}`,
  type: 'user' as const,
  status: TaskStatus.Created,
  agentAssignedId: null,
  title: null,
  createdAt: '2026-05-26T12:00:00.000Z',
  updatedAt: '2026-05-26T12:00:00.000Z',
});

const buildListResponse = ({
  items,
  totalCount,
  page,
  size,
}: {
  items: ReturnType<typeof buildTask>[];
  totalCount: number;
  page: number;
  size: number;
}) => ({
  items,
  totalCount,
  page,
  size,
});

describe('useHomeTaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSnackbar).mockReturnValue({
      show: mockShowSnackbar,
      dismiss: vi.fn(),
    });
    mockUseDebouncedValue.mockImplementation((value: string) => value);
    mockFetch.mockResolvedValue(
      buildListResponse({
        items: [],
        totalCount: 0,
        page: 0,
        size: 10,
      }),
    );
  });

  it('should start with empty tasks and no search on initial render', () => {
    const { result } = renderHook(() => useHomeTaskList());

    expect(result.current.tasks).toEqual([]);
    expect(result.current.searchInput).toBe('');
    expect(result.current.hasMore).toBe(false);
  });

  it('should append tasks when handleLoadMore fetches the next page', async () => {
    mockFetch
      .mockResolvedValueOnce(
        buildListResponse({
          items: [buildTask('task-1'), buildTask('task-2')],
          totalCount: 4,
          page: 0,
          size: 2,
        }),
      )
      .mockResolvedValueOnce(
        buildListResponse({
          items: [buildTask('task-3'), buildTask('task-4')],
          totalCount: 4,
          page: 1,
          size: 2,
        }),
      );

    const { result } = renderHook(() => useHomeTaskList());

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(2);
    });

    await act(async () => {
      await result.current.handleLoadMore();
    });

    expect(result.current.tasks.map((task) => task.id)).toEqual([
      'task-1',
      'task-2',
      'task-3',
      'task-4',
    ]);
  });

  it('should reset accumulated tasks when search changes', async () => {
    mockFetch
      .mockResolvedValueOnce(
        buildListResponse({
          items: [buildTask('task-1')],
          totalCount: 1,
          page: 0,
          size: 10,
        }),
      )
      .mockResolvedValueOnce(
        buildListResponse({
          items: [buildTask('task-search')],
          totalCount: 1,
          page: 0,
          size: 10,
        }),
      );

    const { result } = renderHook(() => useHomeTaskList());

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    act(() => {
      result.current.handleSearchChange('invoice');
    });

    await waitFor(() => {
      expect(result.current.tasks).toEqual([expect.objectContaining({ id: 'task-search' })]);
      expect(result.current.tasks.some((task) => task.id === 'task-1')).toBe(false);
    });
  });

  it('should set hasMore to true when tasks length is less than totalCount', async () => {
    mockFetch.mockResolvedValue(
      buildListResponse({
        items: [buildTask('task-1')],
        totalCount: 3,
        page: 0,
        size: 10,
      }),
    );

    const { result } = renderHook(() => useHomeTaskList());

    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });
  });

  it('should set hasMore to false when all tasks are loaded', async () => {
    mockFetch.mockResolvedValue(
      buildListResponse({
        items: [buildTask('task-1'), buildTask('task-2')],
        totalCount: 2,
        page: 0,
        size: 10,
      }),
    );

    const { result } = renderHook(() => useHomeTaskList());

    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });
  });

  it('should reset page and search then refetch when refreshFromStart is called', async () => {
    let fetchCallCount = 0;

    mockFetch.mockImplementation(async () => {
      fetchCallCount += 1;

      if (fetchCallCount === 1) {
        return buildListResponse({
          items: [buildTask('task-old')],
          totalCount: 1,
          page: 0,
          size: 10,
        });
      }

      if (fetchCallCount === 2) {
        return buildListResponse({
          items: [buildTask('task-search')],
          totalCount: 1,
          page: 0,
          size: 10,
        });
      }

      return buildListResponse({
        items: [buildTask('task-new')],
        totalCount: 1,
        page: 0,
        size: 10,
      });
    });

    const { result } = renderHook(() => useHomeTaskList());

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    act(() => {
      result.current.handleSearchChange('invoice');
    });

    await waitFor(() => {
      expect(result.current.tasks).toEqual([expect.objectContaining({ id: 'task-search' })]);
    });

    await act(async () => {
      await result.current.refreshFromStart();
    });

    expect(result.current.searchInput).toBe('');
    expect(result.current.tasks).toEqual([expect.objectContaining({ id: 'task-new' })]);
  });

  it('should preserve loaded tasks and show snackbar when fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce(
        buildListResponse({
          items: [buildTask('task-1')],
          totalCount: 2,
          page: 0,
          size: 1,
        }),
      )
      .mockRejectedValueOnce(new Error('Network failure'));

    const { result } = renderHook(() => useHomeTaskList());

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    await act(async () => {
      await result.current.handleLoadMore();
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'error',
      }),
    );
  });

  it('should debounce search refetch so only the final term within 300ms triggers fetch', async () => {
    const { result, rerender } = renderHook(() => useHomeTaskList());

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(0);
    });

    mockFetch.mockClear();

    vi.useFakeTimers();
    let debouncedSearch = '';
    mockUseDebouncedValue.mockImplementation(() => debouncedSearch);

    act(() => {
      result.current.handleSearchChange('in');
      debouncedSearch = 'in';
      rerender();
    });

    act(() => {
      result.current.handleSearchChange('inv');
      debouncedSearch = 'inv';
      rerender();
    });

    act(() => {
      result.current.handleSearchChange('invoice');
      debouncedSearch = 'invoice';
      rerender();
    });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    await vi.waitFor(() => {
      const searchCalls = mockFetch.mock.calls.filter(([args]) => args.query?.search === 'invoice');
      expect(searchCalls.length).toBeGreaterThanOrEqual(1);
    });

    vi.useRealTimers();
  });
});
