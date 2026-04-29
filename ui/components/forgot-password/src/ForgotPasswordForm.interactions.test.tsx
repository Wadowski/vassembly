import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import * as forgotPasswordFormHook from './useForgotPasswordForm';

vi.mock('./useForgotPasswordForm', () => ({
  useForgotPasswordForm: vi.fn(),
}));

const useForgotPasswordFormMock = vi.mocked(forgotPasswordFormHook.useForgotPasswordForm);

type UseForgotPasswordFormViewModel = {
  email: string;
  handleEmailChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
};

const mockUseForgotPasswordFormReturn = (
  overrides: Partial<UseForgotPasswordFormViewModel> = {},
): UseForgotPasswordFormViewModel => {
  return {
    email: '',
    handleEmailChange: vi.fn(),
    handleSubmit: vi.fn(async (e) => e.preventDefault()),
    isLoading: false,
    isSuccess: false,
    ...overrides,
  };
};

describe('ForgotPasswordForm (interactions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useForgotPasswordFormMock.mockReturnValue(mockUseForgotPasswordFormReturn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call handleEmailChange when the user types in the email field', async () => {
    const handleEmailChange = vi.fn();
    useForgotPasswordFormMock.mockReturnValue(
      mockUseForgotPasswordFormReturn({ handleEmailChange, handleSubmit: vi.fn() }),
    );
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'a@a.com');
    expect(handleEmailChange).toHaveBeenCalled();
  });

  it('should run handleSubmit when the form is sent via the submit control', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    useForgotPasswordFormMock.mockReturnValue(mockUseForgotPasswordFormReturn({ handleSubmit }));
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    const button = screen.getByRole('button', { name: /send reset link/i });
    await user.click(button);
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  it('should keep the submit control disabled while loading', () => {
    useForgotPasswordFormMock.mockReturnValue(mockUseForgotPasswordFormReturn({ isLoading: true }));
    render(<ForgotPasswordForm />);
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeDisabled();
  });

  it('should disable the email field while loading', () => {
    useForgotPasswordFormMock.mockReturnValue(mockUseForgotPasswordFormReturn({ isLoading: true }));
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
  });

  it('should expose a busy and loading state on the submit control while loading', () => {
    useForgotPasswordFormMock.mockReturnValue(mockUseForgotPasswordFormReturn({ isLoading: true }));
    render(<ForgotPasswordForm />);
    const button = screen.getByRole('button', { name: /send reset link/i });
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('should run handleSubmit when the user sends the form with Enter from the email field', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    useForgotPasswordFormMock.mockReturnValue(mockUseForgotPasswordFormReturn({ handleSubmit }));
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    const email = screen.getByLabelText(/email/i);
    email.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  it('should support moving focus to the submit control for keyboard use', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    useForgotPasswordFormMock.mockReturnValue(mockUseForgotPasswordFormReturn({ handleSubmit }));
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    const email = screen.getByLabelText(/email/i);
    const button = screen.getByRole('button', { name: /send reset link/i });
    email.focus();
    await user.tab();
    expect(button).toHaveFocus();
  });
});
