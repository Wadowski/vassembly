import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SystemAgentRestoreDialog } from './SystemAgentRestoreDialog';

describe('SystemAgentRestoreDialog', () => {
  it('should render restore confirmation copy and actions', () => {
    render(
      <SystemAgentRestoreDialog
        name="Compliance Bot"
        open
        onClose={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText(/restore platform agent/i)).not.toBeNull();
    expect(screen.getByText(/restore compliance bot/i)).not.toBeNull();
    expect(screen.getByRole('button', { name: /cancel/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /^restore$/i })).not.toBeNull();
  });
});
