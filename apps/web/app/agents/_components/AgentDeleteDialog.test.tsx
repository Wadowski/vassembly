import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AgentDeleteDialog } from './AgentDeleteDialog';

describe('AgentDeleteDialog', () => {
  it('should require operators to acknowledge destructive impact against named agents', async () => {
    const user = userEvent.setup();

    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <AgentDeleteDialog agentName="Code Review Helper" open onClose={vi.fn()} onConfirm={onConfirm} />,
    );

    expect(screen.getByRole('heading', { name: /delete agent/i })).not.toBeNull();
    expect(screen.getByText(/code review helper/i)).not.toBeNull();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should cancel gracefully without invoking destructive mutations', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(<AgentDeleteDialog agentName="Temporary Agent" open onClose={onClose} onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
