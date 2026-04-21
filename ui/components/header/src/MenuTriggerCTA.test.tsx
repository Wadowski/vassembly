import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { MenuTriggerCTA } from './MenuTriggerCTA';

describe('MenuTriggerCTA', () => {
  it('calls onPress when clicked', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();

    render(<MenuTriggerCTA onPress={onPress} isExpanded={false} ariaLabel="Menu" />);

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses default accessible name when ariaLabel omitted', () => {
    render(<MenuTriggerCTA onPress={vi.fn()} isExpanded={false} />);

    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });
});
