import React, { useEffect } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Snackbar } from './Snackbar';
import { SnackbarProvider, useSnackbar } from '.';

describe('Snackbar', () => {
  it('renders the message', () => {
    render(<Snackbar message="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders a dismiss button only when isDismissible=true', () => {
    const { rerender } = render(<Snackbar message="Hello" isDismissible={false} />);
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();

    rerender(<Snackbar message="Hello" isDismissible />);
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(<Snackbar message="Hello" isDismissible onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('SnackbarProvider + useSnackbar', () => {
  const ShowOnMount = ({
    message,
    duration,
    isDismissible,
    variant = 'info',
  }: {
    message: string;
    duration: number;
    isDismissible?: boolean;
    variant?: 'info' | 'success' | 'warning' | 'error';
  }) => {
    const { show } = useSnackbar();

    useEffect(() => {
      show({ message, duration, isDismissible, variant });
    }, [duration, isDismissible, message, show, variant]);

    return null;
  };

  it('renders a snackbar when show() is called', async () => {
    render(
      <SnackbarProvider>
        <ShowOnMount message="Shown" duration={0} />
      </SnackbarProvider>,
    );

    expect(await screen.findByText('Shown')).toBeInTheDocument();
  });

  it('auto-dismisses after duration', async () => {
    render(
      <SnackbarProvider>
        <ShowOnMount message="Auto" duration={50} />
      </SnackbarProvider>,
    );

    expect(screen.getByText('Auto')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText('Auto')).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('dismiss(id) removes a specific snackbar', async () => {
    const cryptoObj = globalThis.crypto as { randomUUID?: () => string } | undefined;
    if (!cryptoObj || typeof cryptoObj.randomUUID !== 'function') throw new Error('crypto.randomUUID is required');

    const uuidSpy = vi.spyOn(cryptoObj, 'randomUUID');
    uuidSpy.mockReturnValueOnce('snack-1').mockReturnValueOnce('snack-2');

    const Harness = () => {
      const { show, dismiss } = useSnackbar();

      useEffect(() => {
        show({ message: 'One', duration: 0 });
        show({ message: 'Two', duration: 0 });
        dismiss('snack-1');
      }, [dismiss, show]);

      return null;
    };

    render(
      <SnackbarProvider>
        <Harness />
      </SnackbarProvider>,
    );

    expect(await screen.findByText('Two')).toBeInTheDocument();
    expect(screen.queryByText('One')).not.toBeInTheDocument();

    uuidSpy.mockRestore();
  });

  it('respects maxVisible by removing the oldest snackbar', async () => {
    const Harness = () => {
      const { show } = useSnackbar();

      useEffect(() => {
        show({ message: 'One', duration: 0 });
        show({ message: 'Two', duration: 0 });
        show({ message: 'Three', duration: 0 });
      }, [show]);

      return null;
    };

    render(
      <SnackbarProvider maxVisible={2}>
        <Harness />
      </SnackbarProvider>,
    );

    expect(await screen.findByText('Two')).toBeInTheDocument();
    expect(await screen.findByText('Three')).toBeInTheDocument();
    expect(screen.queryByText('One')).not.toBeInTheDocument();
  });

  it('useSnackbar throws when used outside SnackbarProvider', () => {
    const Outside = () => {
      useSnackbar();
      return null;
    };

    expect(() => render(<Outside />)).toThrow(/SnackbarProvider/);
  });
});

