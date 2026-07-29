import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ActivityMcpInvocationRow } from './ActivityMcpInvocationRow';

import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';

const baseItem: TaskActivityItemDto = {
  kind: 'toolInvocation',
  id: 'tool-event-1',
  occurredAt: new Date('2026-01-01T10:00:00.000Z').toISOString(),
  sortKey: 'event-1',
  filterGroup: 'toolCalls',
  usageEventId: 'event-1',
  agentName: 'Planner Agent',
  toolName: 'use_agent',
  internalToolId: 'agent-use',
  internalToolDisplayName: 'Use Agent',
  status: 'success',
  startedAt: new Date('2026-01-01T10:00:00.000Z').toISOString(),
  endedAt: new Date('2026-01-01T10:00:01.200Z').toISOString(),
  durationMs: 1200,
  input: '{"agentId":"abc"}',
  output: '{"message":"done"}',
};

describe('ActivityMcpInvocationRow', () => {
  it('should render tool icon and tool name in header and toggle details on click', async () => {
    const user = userEvent.setup();

    render(<ActivityMcpInvocationRow item={baseItem} />);

    expect(screen.getByText('Use Agent')).toBeInTheDocument();
    expect(screen.queryByText('Planner Agent')).toBeNull();
    expect(screen.queryByTestId('activity-tool-details-event-1')).toBeNull();

    await user.click(screen.getByRole('button'));

    const details = screen.getByTestId('activity-tool-details-event-1');
    expect(details).toHaveTextContent('Started at');
    expect(details).toHaveTextContent('Ended at');
    expect(details).toHaveTextContent('Planner Agent');
    expect(details).toHaveTextContent('{"agentId":"abc"}');
    expect(details).toHaveTextContent('{"message":"done"}');
    expect(details).not.toHaveTextContent('Invocation');
  });

  it('should show in progress status for running tool calls', () => {
    render(
      <ActivityMcpInvocationRow
        item={{
          ...baseItem,
          status: 'in_progress',
          endedAt: null,
          durationMs: null,
          output: null,
        }}
      />,
    );

    expect(screen.getByText('In progress')).toBeInTheDocument();
  });
});
