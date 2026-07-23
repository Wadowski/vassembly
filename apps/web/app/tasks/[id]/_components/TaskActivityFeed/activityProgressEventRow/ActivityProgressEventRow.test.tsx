import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';

import { ActivityProgressEventRow } from './ActivityProgressEventRow';

const buildProgressItem = (): TaskActivityItemDto => ({
  kind: 'progressEvent',
  id: 'progress-1',
  occurredAt: '2026-01-01T00:00:00.000Z',
  sortKey: 'progress-1',
  filterGroup: 'agentStarted',
  commentId: 'comment-1',
  eventId: 'event-1',
  state: 'started',
  inputMessages: 'request payload',
});

describe('ActivityProgressEventRow', () => {
  it('should toggle inline details when the row is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ul>
        <ActivityProgressEventRow item={buildProgressItem()} />
      </ul>,
    );

    expect(screen.queryByTestId('activity-progress-details-event-1')).toBeNull();

    await user.click(screen.getByRole('button'));

    expect(screen.getByTestId('activity-progress-details-event-1')).toHaveTextContent(
      'request payload',
    );
  });
});
