import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import type { CommonError } from '@vassembly/errors';
import { RegisterForm } from './RegisterForm';

const validPassword = 'Str0ng!Pass';

const h = vi.hoisted(() => {
  return {
    register: {
      data: undefined as
        | {
            authToken: string;
            refreshToken: string;
            user: { id: string; email: string; firstName?: string; lastName?: string };
            requiresEmailVerification?: boolean;
          }
        | undefined,
      error: undefined as CommonError | undefined,
      isLoading: false,
      fetch: vi.fn(),
    },
    setSession: vi.fn(),
    show: vi.fn(),
  };
});

vi.mock('@vassembly/ui-api-hooks', () => ({
  useRegister: () => h.register,
}));

vi.mock('@vassembly/ui-user-auth', () => ({
  useUserAuth: () => ({ setSession: h.setSession }),
}));

vi.mock('@vassembly/ui-system-design/snackbar', () => ({
  useSnackbar: () => ({ show: h.show }),
}));

describe('RegisterForm policy acceptance user flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.register.data = undefined;
    h.register.error = undefined;
    h.register.isLoading = false;
    h.register.fetch = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, origin: 'https://app.example.com', href: 'https://app.example.com/' },
    });
  });

  it('should block submit until privacy is accepted, then register when both policies are checked', async () => {
    const user = userEvent.setup();
    h.register.fetch = vi.fn(async () => {
      h.register.data = {
        authToken: 'a',
        refreshToken: 'r',
        user: { id: '1', email: 'flow@example.com', firstName: 'Jane', lastName: 'Doe' },
      };
    });
    render(<RegisterForm fallbackPath="/" />);
    await user.type(screen.getByLabelText(/^email$/i), 'flow@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/^password$/i), validPassword);
    await user.type(screen.getByLabelText(/confirm password/i), validPassword);
    await user.click(screen.getByRole('checkbox', { name: /terms and conditions/i }));
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(h.show).toHaveBeenCalledWith({
        message: 'You must accept the Privacy Policy',
        variant: 'error',
      });
    });
    expect(screen.getByLabelText(/^email$/i)).toHaveValue('flow@example.com');
    expect(h.register.fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole('checkbox', { name: /privacy policy/i }));
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(h.register.fetch).toHaveBeenCalledWith({
        body: {
          email: 'flow@example.com',
          password: validPassword,
          firstName: 'Jane',
          lastName: 'Doe',
        },
      });
    });
  });
});
