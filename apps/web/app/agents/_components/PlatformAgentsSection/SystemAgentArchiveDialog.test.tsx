import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SystemAgentArchiveDialog } from './SystemAgentArchiveDialog';

describe('SystemAgentArchiveDialog', () => {
  it('should render archive confirmation copy and actions', () => {
    render(
      <SystemAgentArchiveDialog
        name="Compliance Bot"
        open
        onClose={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText(/archive platform agent/i)).not.toBeNull();
    expect(screen.getByText(/archive compliance bot/i)).not.toBeNull();
    expect(screen.getByRole('button', { name: /cancel/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /^archive$/i })).not.toBeNull();
  });
});
