import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('ForgotPasswordForm (accessibility)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useForgotPasswordFormMock.mockReturnValue(mockUseForgotPasswordFormReturn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should allow the title to be associated with a stable id for accessibility', () => {
    render(<ForgotPasswordForm title="Forgot password" titleId="forgot-password-title" />);
    const title = document.getElementById('forgot-password-title');
    expect(title).toBeInTheDocument();
  });

  it('should set aria-describedby on the form when titleId is provided', () => {
    render(<ForgotPasswordForm title="Heading" titleId="fp-title" />);
    expect(screen.getByRole('form')).toHaveAttribute('aria-describedby', 'fp-title');
  });

  it('should set aria-describedby on the email field when titleId is provided', () => {
    render(<ForgotPasswordForm title="Heading" titleId="fp-title" />);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-describedby', 'fp-title');
  });

  it('should present the form as a single form region with role="form"', () => {
    render(<ForgotPasswordForm />);
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
    expect(form).toBeVisible();
  });

  it('should pair a visible label with the email field id for accessibility', () => {
    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText(/email/i);
    const id = emailInput.getAttribute('id');
    expect(id).toBeTruthy();
    const label = document.querySelector(`label[for="${id}"]`);
    expect(label).toBeInTheDocument();
  });

  it('should expose the success state with role status and a polite live region', () => {
    useForgotPasswordFormMock.mockReturnValue(mockUseForgotPasswordFormReturn({ isSuccess: true }));
    render(<ForgotPasswordForm />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
  });
});
