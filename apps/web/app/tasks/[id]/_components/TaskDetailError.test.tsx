import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  TASK_NOT_FOUND_DETAIL,
  TASK_NOT_FOUND_MESSAGE,
} from '../constants';
import { TaskDetailError } from './TaskDetailError';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('TaskDetailError', () => {
  it('should render not-found copy and back action', async () => {
    const user = userEvent.setup();

    render(<TaskDetailError variant="notFound" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(TASK_NOT_FOUND_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(TASK_NOT_FOUND_DETAIL)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to tasks' }));

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should render error message with retry and back actions', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <TaskDetailError
        variant="error"
        message="Could not load task"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Could not load task')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to tasks' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await user.click(screen.getByRole('button', { name: 'Back to tasks' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
