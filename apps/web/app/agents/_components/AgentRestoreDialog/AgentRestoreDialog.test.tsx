import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AgentRestoreDialog } from './AgentRestoreDialog';

describe('AgentRestoreDialog', () => {
  it('should confirm restorative workflows referencing canonical catalog naming', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(<AgentRestoreDialog agentName="Ops Buddy" open onClose={vi.fn()} onConfirm={onConfirm} />);

    expect(screen.getByRole('heading', { name: /restore agent/i })).not.toBeNull();
    expect(screen.getByText(/ops buddy/i)).not.toBeNull();

    await user.click(screen.getByRole('button', { name: /^restore$/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should prefer cancelling ambiguous restores until explicitly acknowledged', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(<AgentRestoreDialog agentName="Cold Storage" open onClose={onClose} onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
