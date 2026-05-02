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

describe('ForgotPasswordForm (render)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useForgotPasswordFormMock.mockReturnValue(mockUseForgotPasswordFormReturn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the email field and a submit control', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('should render a custom title when a title is provided', () => {
    render(<ForgotPasswordForm title="Reset your access" />);
    expect(screen.getByText(/reset your access/i)).toBeInTheDocument();
  });

  it('should hide the form fields and show a confirmation message when isSuccess is true', () => {
    useForgotPasswordFormMock.mockReturnValue(
      mockUseForgotPasswordFormReturn({ isSuccess: true, email: 'u@e.com' }),
    );
    render(<ForgotPasswordForm />);
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /check your email|sent|we('ve| have) sent|instructions|inbox|thank you|next step/i,
      ),
    ).toBeInTheDocument();
  });

  it('should apply className to the container element', () => {
    const { container } = render(<ForgotPasswordForm className="my-forgot" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/my-forgot/);
  });

  it('should render a custom submit label when provided', () => {
    render(<ForgotPasswordForm submitLabel="Email me a link" />);
    expect(screen.getByRole('button', { name: /email me a link/i })).toBeInTheDocument();
  });

  it('should use an email-appropriate input for the email field', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
  });

  it('should use a primary submit for the CTA with type="submit"', () => {
    render(<ForgotPasswordForm />);
    const button = screen.getByRole('button', { name: /send reset link/i });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should pass onSuccess to the form hook when provided', () => {
    const onSuccess = vi.fn();
    render(<ForgotPasswordForm onSuccess={onSuccess} />);
    expect(useForgotPasswordFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ onSuccess }),
    );
  });
});
