import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { LoginForm } from './LoginForm';
import * as loginFormHook from './useLoginForm';

vi.mock('./useLoginForm', () => ({
  useLoginForm: vi.fn(),
}));

const useLoginFormMock = vi.mocked(loginFormHook.useLoginForm);

type UseLoginFormViewModel = {
  email: string;
  password: string;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
};

const mockUseLoginFormReturn = (overrides: Partial<UseLoginFormViewModel> = {}): UseLoginFormViewModel => {
  return {
    email: '',
    password: '',
    handleEmailChange: vi.fn(),
    handlePasswordChange: vi.fn(),
    handleSubmit: vi.fn(async (e) => e.preventDefault()),
    isLoading: false,
    ...overrides,
  };
};

describe('LoginForm (component)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLoginFormMock.mockReturnValue(mockUseLoginFormReturn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should render a submit control with a default sign-in label', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should allow the optional title to be associated with a stable id for accessibility', () => {
    render(<LoginForm titleId="login-title" />);
    const title = document.getElementById('login-title');
    expect(title).toBeInTheDocument();
  });

  it('should call handleEmailChange when the user types in the email field', async () => {
    const handleEmailChange = vi.fn();
    useLoginFormMock.mockReturnValue(
      mockUseLoginFormReturn({ handleEmailChange, handleSubmit: vi.fn() }),
    );
    const user = userEvent.setup();
    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');
    expect(handleEmailChange).toHaveBeenCalled();
  });

  it('should call handlePasswordChange when the user types in the password field', async () => {
    const handlePasswordChange = vi.fn();
    useLoginFormMock.mockReturnValue(
      mockUseLoginFormReturn({ handlePasswordChange, handleSubmit: vi.fn() }),
    );
    const user = userEvent.setup();
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');
    expect(handlePasswordChange).toHaveBeenCalled();
  });

  it('should run handleSubmit when the form is sent via the button', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    useLoginFormMock.mockReturnValue(mockUseLoginFormReturn({ handleSubmit }));
    const user = userEvent.setup();
    render(<LoginForm />);
    const button = screen.getByRole('button', { name: /sign in/i });
    await user.click(button);
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  it('should keep the submit control disabled while loading', () => {
    useLoginFormMock.mockReturnValue(mockUseLoginFormReturn({ isLoading: true }));
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('should disable the fields while loading', () => {
    useLoginFormMock.mockReturnValue(mockUseLoginFormReturn({ isLoading: true }));
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
  });

  it('should pair visible labels with field ids for the email and password fields', () => {
    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/email/i);
    const emailId = emailInput.getAttribute('id');
    expect(emailId).toBeTruthy();
    const emailLabel = document.querySelector(`label[for="${emailId}"]`);
    expect(emailLabel).toBeInTheDocument();
  });

  it('should support keyboard use from fields through to submit', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    useLoginFormMock.mockReturnValue(mockUseLoginFormReturn({ handleSubmit }));
    const user = userEvent.setup();
    render(<LoginForm />);
    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i);
    const button = screen.getByRole('button', { name: /sign in/i });
    email.focus();
    expect(email).toHaveFocus();
    await user.tab();
    expect(password).toHaveFocus();
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  it('should render the password as a masked text field', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
  });

  it('should use an email-appropriate input for the email field', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
  });

  it('should use a primary submit for the CTA with type="submit"', () => {
    render(<LoginForm />);
    const button = screen.getByRole('button', { name: /sign in/i });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should render a custom submit label when provided', () => {
    render(<LoginForm submitLabel="Log In" />);
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('should not place initial focus in the first field by default', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).not.toHaveFocus();
  });

  it('should expose a busy state on the submit control while loading', () => {
    useLoginFormMock.mockReturnValue(mockUseLoginFormReturn({ isLoading: true }));
    render(<LoginForm />);
    const button = screen.getByRole('button', { name: /sign in/i });
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('should present the sign-in form as a single form region (stacked field layout)', () => {
    render(<LoginForm />);
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
    expect(form).toBeVisible();
  });
});
