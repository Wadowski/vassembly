import { describe, expect, it, vi, beforeEach } from 'vitest';

import { act, renderHook, waitFor } from '@testing-library/react';

import { useTaskActivityFeed } from './useTaskActivityFeed';

const mockFetch = vi.fn();

vi.mock('@vassembly/ui-api-hooks', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@vassembly/ui-api-hooks')>();
  return {
    ...mod,
    useTaskActivityTimeline: () => ({
      fetch: mockFetch,
    }),
  };
});

describe('useTaskActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue([
      {
        kind: 'userComment',
        id: 'c1',
        occurredAt: '2026-01-02T00:00:00.000Z',
        sortKey: 'c1',
        filterGroup: 'comments',
        commentId: 'comment-1',
        userText: 'Hello',
      },
      {
        kind: 'progressEvent',
        id: 'p1',
        occurredAt: '2026-01-01T00:00:00.000Z',
        sortKey: 'p1',
        filterGroup: 'agentStarted',
        state: 'started',
      },
    ]);
  });

  it('should filter items when a filter group is deselected', async () => {
    const { result } = renderHook(() =>
      useTaskActivityFeed({
        taskId: 'task-1',
        taskStatus: 'done',
        activeCommentId: null,
        pendingUserComment: null,
        onPendingUserCommentSynced: vi.fn(),
        onTaskUpdated: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    result.current.setSelectedGroups(['comments']);

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]?.kind).toBe('userComment');
    });
  });

  it('should show pending user comment before timeline fetch includes it', async () => {
    mockFetch.mockResolvedValue([]);

    const pendingComment = {
      id: 'comment-new',
      taskId: 'task-1',
      userId: 'user-1',
      userText: 'Follow up',
      agentResponse: null,
      specializationIds: [],
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    };

    const { result, rerender } = renderHook(
      ({ pending }: { pending: typeof pendingComment | null }) =>
        useTaskActivityFeed({
          taskId: 'task-1',
          taskStatus: 'in-progress',
          activeCommentId: 'comment-new',
          pendingUserComment: pending,
          onPendingUserCommentSynced: vi.fn(),
          onTaskUpdated: vi.fn(),
        }),
      {
        initialProps: { pending: null as typeof pendingComment | null },
      },
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(0);
    });

    rerender({ pending: pendingComment });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]?.kind).toBe('userComment');
      expect(result.current.items[0]?.userText).toBe('Follow up');
    });
  });

  it('should keep polling timeline when onTaskUpdated identity changes each render', async () => {
    vi.useFakeTimers();

    const { rerender } = renderHook(
      ({ onTaskUpdated }: { onTaskUpdated: () => void }) =>
        useTaskActivityFeed({
          taskId: 'task-1',
          taskStatus: 'in-progress',
          activeCommentId: 'comment-1',
          pendingUserComment: null,
          onPendingUserCommentSynced: vi.fn(),
          onTaskUpdated,
        }),
      { initialProps: { onTaskUpdated: vi.fn() } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    mockFetch.mockClear();

    rerender({ onTaskUpdated: vi.fn() });
    rerender({ onTaskUpdated: vi.fn() });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);

    vi.useRealTimers();
  });
});
