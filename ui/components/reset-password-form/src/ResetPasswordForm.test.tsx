import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { ResetPasswordForm } from './ResetPasswordForm';
import * as resetPasswordFormHook from './useResetPasswordForm';

vi.mock('./useResetPasswordForm', () => ({
  useResetPasswordForm: vi.fn(),
}));

const useResetPasswordFormMock = vi.mocked(resetPasswordFormHook.useResetPasswordForm);

type UseResetPasswordFormViewModel = {
  password: string;
  confirmPassword: string;
  passwordError: string | undefined;
  confirmPasswordError: string | undefined;
  handlePasswordChange: (value: string) => void;
  handleConfirmPasswordChange: (value: string) => void;
  handlePasswordBlur: () => void;
  handleConfirmBlur: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
};

const mockUseResetPasswordFormReturn = (
  overrides: Partial<UseResetPasswordFormViewModel> = {},
): UseResetPasswordFormViewModel => {
  return {
    password: '',
    confirmPassword: '',
    passwordError: undefined,
    confirmPasswordError: undefined,
    handlePasswordChange: vi.fn(),
    handleConfirmPasswordChange: vi.fn(),
    handlePasswordBlur: vi.fn(),
    handleConfirmBlur: vi.fn(),
    handleSubmit: vi.fn(async (e) => e.preventDefault()),
    isLoading: false,
    ...overrides,
  };
};

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResetPasswordFormMock.mockReturnValue(mockUseResetPasswordFormReturn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should use type submit for the primary button', () => {
    render(<ResetPasswordForm token="t" />);
    expect(screen.getByRole('button', { name: /update password/i })).toHaveAttribute('type', 'submit');
  });

  it('should render heading with titleId when provided', () => {
    render(<ResetPasswordForm token="t" titleId="reset-title" />);
    expect(document.getElementById('reset-title')).toBeInTheDocument();
  });

  it('should render new password and confirm password fields', () => {
    render(<ResetPasswordForm token="t" />);
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('should use password input types for both fields', () => {
    render(<ResetPasswordForm token="t" />);
    expect(screen.getByLabelText(/new password/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password');
  });

  it('should call handlePasswordChange when the user types in the password field', async () => {
    const handlePasswordChange = vi.fn();
    useResetPasswordFormMock.mockReturnValue(mockUseResetPasswordFormReturn({ handlePasswordChange }));
    const user = userEvent.setup();
    render(<ResetPasswordForm token="t" />);
    await user.type(screen.getByLabelText(/new password/i), 'a');
    expect(handlePasswordChange).toHaveBeenCalled();
  });

  it('should call handleSubmit when the form is submitted', async () => {
    const handleSubmit = vi.fn(async (e) => e.preventDefault());
    useResetPasswordFormMock.mockReturnValue(mockUseResetPasswordFormReturn({ handleSubmit }));
    const user = userEvent.setup();
    render(<ResetPasswordForm token="t" />);
    await user.click(screen.getByRole('button', { name: /update password/i }));
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  it('should disable fields and submit while loading', () => {
    useResetPasswordFormMock.mockReturnValue(mockUseResetPasswordFormReturn({ isLoading: true }));
    render(<ResetPasswordForm token="t" />);
    expect(screen.getByRole('button', { name: /update password/i })).toBeDisabled();
    expect(screen.getByLabelText(/new password/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
  });

  it('should surface field error messages from the hook', () => {
    useResetPasswordFormMock.mockReturnValue(
      mockUseResetPasswordFormReturn({
        passwordError: 'Password must include a number.',
      }),
    );
    render(<ResetPasswordForm token="t" />);
    expect(screen.getByText('Password must include a number.')).toBeInTheDocument();
  });

  it('should use a custom submit label when provided', () => {
    render(<ResetPasswordForm token="t" submitLabel="Save" />);
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
  });
});
