import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TaskDetailSkeleton } from './TaskDetailSkeleton';

describe('TaskDetailSkeleton', () => {
  it('should render loading skeleton with busy state marker', () => {
    const { container } = render(<TaskDetailSkeleton />);

    expect(screen.getByTestId('task-detail-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('task-detail-skeleton')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('main')).toBeInTheDocument();
  });
});
