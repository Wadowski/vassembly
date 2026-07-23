import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TaskList } from './TaskList';
import type { TaskListItemDto } from './types';
import { TaskStatus, TaskType } from '@vassembly/ui-api-hooks/src/tasks/types';

const buildTask = (partial: Partial<TaskListItemDto> = {}): TaskListItemDto => ({
  id: partial.id ?? 'task-1',
  userId: partial.userId ?? 'user-1',
  description: partial.description ?? 'Review quarterly report',
  type: partial.type ?? TaskType.User,
  status: partial.status ?? TaskStatus.Created,
  agentAssignedId: partial.agentAssignedId ?? null,
  title: partial.title ?? null,
  activeCommentId: partial.activeCommentId ?? null,
  errorMessage: partial.errorMessage ?? null,
  errorCode: partial.errorCode ?? null,
  startedAt: partial.startedAt ?? null,
  completedAt: partial.completedAt ?? null,
  failedAt: partial.failedAt ?? null,
  pausedAt: partial.pausedAt ?? null,
  createdAt: partial.createdAt ?? '2026-05-26T12:00:00.000Z',
  updatedAt: partial.updatedAt ?? '2026-05-26T12:00:00.000Z',
});

const defaultProps = {
  tasks: [] as TaskListItemDto[],
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
  searchValue: '',
  onSearchChange: vi.fn(),
  onLoadMore: vi.fn(),
};

describe('TaskList', () => {
  describe('render', () => {
    it('should render task rows when tasks are provided', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[
            buildTask({ id: 'task-1', description: 'First task' }),
            buildTask({ id: 'task-2', description: 'Second task' }),
          ]}
        />,
      );

      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByText('Second task')).toBeInTheDocument();
    });

    it('should render description and status badge for each task', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[buildTask({ description: 'Parse invoices', status: TaskStatus.InProgress })]}
        />,
      );

      expect(screen.getByText('Parse invoices')).toBeInTheDocument();
      expect(screen.getByText('In progress')).toBeInTheDocument();
    });

    it('should render status badge with label for created tasks', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[buildTask({ status: TaskStatus.Created })]}
        />,
      );

      expect(screen.getByText('Created')).toBeInTheDocument();
    });

    it('should render title line only when title is truthy', () => {
      const { rerender } = render(
        <TaskList
          {...defaultProps}
          tasks={[buildTask({ title: 'Summarized invoice parsing work' })]}
        />,
      );

      expect(screen.getByText('Summarized invoice parsing work')).toBeInTheDocument();

      rerender(
        <TaskList
          {...defaultProps}
          tasks={[buildTask({ title: null })]}
        />,
      );

      expect(screen.queryByText('Summarized invoice parsing work')).not.toBeInTheDocument();
    });

    it('should render skeleton placeholders when loading initial page with no tasks', () => {
      render(<TaskList {...defaultProps} isLoading tasks={[]} />);

      expect(screen.getByTestId('task-list-skeleton')).toBeInTheDocument();
    });

    it('should render nothing when idle with no tasks and no search value', () => {
      const { container } = render(<TaskList {...defaultProps} tasks={[]} isLoading={false} searchValue="" />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should render search input when list is visible', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[buildTask()]}
        />,
      );

      expect(screen.getByPlaceholderText(/search tasks/i)).toBeInTheDocument();
    });

    it('should render search input when search value is present even if task list is empty', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[]}
          searchValue="invoice"
        />,
      );

      expect(screen.getByPlaceholderText(/search tasks/i)).toBeInTheDocument();
    });

    it('should show Load More button when hasMore is true', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[buildTask()]}
          hasMore
        />,
      );

      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
    });

    it('should hide Load More button when hasMore is false', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[buildTask()]}
          hasMore={false}
        />,
      );

      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onSearchChange when typing in search input', async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();

      const SearchHarness = (): JSX.Element => {
        const [searchValue, setSearchValue] = useState('');

        return (
          <TaskList
            {...defaultProps}
            tasks={[buildTask()]}
            searchValue={searchValue}
            onSearchChange={(value) => {
              setSearchValue(value);
              onSearchChange(value);
            }}
          />
        );
      };

      render(<SearchHarness />);

      await user.type(screen.getByPlaceholderText(/search tasks/i), 'invoice');

      expect(onSearchChange).toHaveBeenLastCalledWith('invoice');
    });

    it('should call onLoadMore when Load More is clicked', async () => {
      const user = userEvent.setup();
      const onLoadMore = vi.fn();

      render(
        <TaskList
          {...defaultProps}
          tasks={[buildTask()]}
          hasMore
          onLoadMore={onLoadMore}
        />,
      );

      await user.click(screen.getByRole('button', { name: /load more/i }));

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should show loading state on Load More button when isLoadingMore is true', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[buildTask()]}
          hasMore
          isLoadingMore
        />,
      );

      expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
    });
  });

  describe('edge cases', () => {
    it('should render placeholder text when description is empty', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[buildTask({ description: '' })]}
        />,
      );

      expect(screen.getByText(/no description/i)).toBeInTheDocument();
    });

    it('should apply line clamp styling to long descriptions', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[buildTask({ description: 'x'.repeat(300) })]}
        />,
      );

      expect(screen.getByTestId('task-description')).toHaveClass('descriptionClamp');
    });

    it('should render Unknown status label when status is missing', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[buildTask({ status: 'unknown-status' as TaskListItemDto['status'] })]}
        />,
      );

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should not crash when title is null or undefined', () => {
      render(
        <TaskList
          {...defaultProps}
          tasks={[
            buildTask({ id: 'null-summary', title: null }),
            buildTask({ id: 'undefined-summary', title: undefined }),
          ]}
        />,
      );

      expect(screen.queryByTestId('task-ai-summary')).not.toBeInTheDocument();
    });
  });
});
