import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders the message', () => {
    render(<Alert message="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('uses role alert for error and warning variants', () => {
    const { rerender } = render(<Alert message="E" variant="error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<Alert message="W" variant="warning" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('uses role status for info and success variants', () => {
    render(<Alert message="I" variant="info" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not render an icon slot when showIcon is false', () => {
    const { container } = render(<Alert message="Hi" showIcon={false} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders the default variant icon when showIcon is true', () => {
    const { container } = render(<Alert message="Hi" showIcon variant="success" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a custom icon when showIcon is true and icon is provided', () => {
    render(
      <Alert
        message="Hi"
        showIcon
        variant="info"
        icon={<span data-testid="custom-icon">★</span>}
      />,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders static details when not collapsible', () => {
    render(<Alert message="Summary" details="Extra" />);
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Extra')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /details/i })).not.toBeInTheDocument();
  });

  it('toggles collapsible details and updates aria-expanded', async () => {
    const user = userEvent.setup();
    render(
      <Alert
        message="Summary"
        details="Extra detail"
        isCollapsible
        defaultIsExpanded
      />,
    );

    const toggle = screen.getByRole('button', { name: /hide details/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await act(async () => {
      await user.click(toggle);
    });
    expect(screen.getByRole('button', { name: /show details/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('ignores collapsible when details are missing', () => {
    render(<Alert message="Only" isCollapsible />);
    expect(screen.queryByRole('button', { name: /details/i })).not.toBeInTheDocument();
  });

  it('calls onExpandedChange when toggled in controlled mode', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();

    const Controlled = (): JSX.Element => {
      const [open, setOpen] = useState(false);

      return (
        <Alert
          message="M"
          details="D"
          isCollapsible
          isExpanded={open}
          onExpandedChange={(next) => {
            onExpandedChange(next);
            setOpen(next);
          }}
        />
      );
    };

    render(<Controlled />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /show details/i }));
    });
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('D')).toBeVisible();
  });
});
