import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TaskActivityFeed } from './TaskActivityFeed';

vi.mock('./useTaskActivityFeed', () => ({
  useTaskActivityFeed: () => ({
    items: [],
    selectedGroups: [],
    setSelectedGroups: vi.fn(),
    isEmpty: true,
  }),
}));

vi.mock('./TaskActivityFeedItem', () => ({
  TaskActivityFeedItem: () => null,
}));

vi.mock('./taskActivityThinkingIndicator', () => ({
  TaskActivityThinkingIndicator: () => (
    <div data-testid="task-activity-thinking-indicator">Thinking</div>
  ),
}));

describe('TaskActivityFeed', () => {
  const defaultProps = {
    taskId: 'task-1',
    activeCommentId: null,
    pendingUserComment: null,
    onPendingUserCommentSynced: vi.fn(),
    onTaskUpdated: vi.fn(),
    isAdmin: false,
  };

  it('should show thinking indicator when task is in progress', () => {
    render(<TaskActivityFeed {...defaultProps} taskStatus="in-progress" />);

    expect(screen.getByTestId('task-activity-thinking-indicator')).toBeInTheDocument();
  });

  it('should hide thinking indicator when task is paused', () => {
    render(<TaskActivityFeed {...defaultProps} taskStatus="paused" />);

    expect(screen.queryByTestId('task-activity-thinking-indicator')).toBeNull();
  });

  it('should hide thinking indicator when task is done', () => {
    render(<TaskActivityFeed {...defaultProps} taskStatus="done" />);

    expect(screen.queryByTestId('task-activity-thinking-indicator')).toBeNull();
  });
});
