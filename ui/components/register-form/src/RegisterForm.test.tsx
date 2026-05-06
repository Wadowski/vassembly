import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { RegisterForm } from './RegisterForm';
import * as registerFormHook from './useRegisterForm';

vi.mock('./useRegisterForm', () => ({
  useRegisterForm: vi.fn(),
}));

const useRegisterFormMock = vi.mocked(registerFormHook.useRegisterForm);

const validPassword = 'Str0ng!Pass!';

type UseRegisterFormViewModel = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptedPrivacyPolicy: boolean;
  acceptedTerms: boolean;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleConfirmPasswordChange: (value: string) => void;
  handleFirstNameChange: (value: string) => void;
  handleLastNameChange: (value: string) => void;
  handleAcceptedPrivacyPolicyChange: (isChecked: boolean) => void;
  handleAcceptedTermsChange: (isChecked: boolean) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
};

const mockUseRegisterFormReturn = (
  overrides: Partial<UseRegisterFormViewModel> = {},
): UseRegisterFormViewModel => {
  return {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    acceptedPrivacyPolicy: false,
    acceptedTerms: false,
    handleEmailChange: vi.fn(),
    handlePasswordChange: vi.fn(),
    handleConfirmPasswordChange: vi.fn(),
    handleFirstNameChange: vi.fn(),
    handleLastNameChange: vi.fn(),
    handleAcceptedPrivacyPolicyChange: vi.fn(),
    handleAcceptedTermsChange: vi.fn(),
    handleSubmit: vi.fn(async (e) => e.preventDefault()),
    isLoading: false,
    ...overrides,
  };
};

describe('RegisterForm (component)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRegisterFormMock.mockReturnValue(mockUseRegisterFormReturn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render a registration title element when titleId is provided', () => {
    render(<RegisterForm titleId="register-title" />);
    expect(document.getElementById('register-title')).toBeInTheDocument();
  });

  it('should render email, first name, last name, password, and confirm password fields', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('should render a password strength indicator', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('status', { name: /password strength/i })).toBeInTheDocument();
  });

  it('should render a primary submit control with a default register label', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('button', { name: /create account|register|sign up/i })).toBeInTheDocument();
  });

  it('should pair visible labels with input ids for each text field', () => {
    render(<RegisterForm />);
    const matchers = [/email/i, /first name/i, /last name/i, /^password$/i, /confirm password/i];
    for (const matcher of matchers) {
      const input = screen.getByLabelText(matcher);
      const id = input.getAttribute('id');
      expect(id).toBeTruthy();
      expect(document.querySelector(`label[for="${id}"]`)).toBeInTheDocument();
    }
  });

  it('should use password type for password and confirm password inputs', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password');
  });

  it('should use an email-appropriate input type for the email field', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
  });

  it('should surface strong or good strength text when the hook supplies a strong password value', () => {
    useRegisterFormMock.mockReturnValue(
      mockUseRegisterFormReturn({
        password: validPassword,
      }),
    );
    render(<RegisterForm />);
    expect(screen.getByRole('status', { name: /password strength/i }).textContent).toMatch(/strong|good/i);
  });

  it('should call handlePasswordChange when the user types in the password field', async () => {
    const handlePasswordChange = vi.fn();
    useRegisterFormMock.mockReturnValue(mockUseRegisterFormReturn({ handlePasswordChange }));
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByLabelText(/^password$/i), 'a');
    expect(handlePasswordChange).toHaveBeenCalled();
  });

  it('should call handleEmailChange when the user types in the email field', async () => {
    const handleEmailChange = vi.fn();
    useRegisterFormMock.mockReturnValue(mockUseRegisterFormReturn({ handleEmailChange }));
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByLabelText(/email/i), 'x@x.com');
    expect(handleEmailChange).toHaveBeenCalled();
  });

  it('should call handleSubmit when the form is submitted via the button', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    useRegisterFormMock.mockReturnValue(mockUseRegisterFormReturn({ handleSubmit }));
    const user = userEvent.setup();
    render(<RegisterForm />);
    const button = screen.getByRole('button', { name: /create account|register|sign up/i });
    await user.click(button);
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  it('should disable interactive controls while loading', () => {
    useRegisterFormMock.mockReturnValue(mockUseRegisterFormReturn({ isLoading: true }));
    render(<RegisterForm />);
    expect(screen.getByRole('button', { name: /create account|register|sign up/i })).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/first name/i)).toBeDisabled();
    expect(screen.getByLabelText(/last name/i)).toBeDisabled();
    expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
  });

  it('should mark the submit control as busy for assistive technologies while loading', () => {
    useRegisterFormMock.mockReturnValue(mockUseRegisterFormReturn({ isLoading: true }));
    render(<RegisterForm />);
    const button = screen.getByRole('button', { name: /create account|register|sign up/i });
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('should use type submit for the primary button', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('button', { name: /create account|register|sign up/i })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('should render a custom submit label when provided', () => {
    render(<RegisterForm submitLabel="Sign up" />);
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should render privacy policy and terms acceptance checkboxes', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('checkbox', { name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /terms and conditions/i })).toBeInTheDocument();
  });
});
