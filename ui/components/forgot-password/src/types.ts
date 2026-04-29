import type { FormEvent } from 'react';

export interface ForgotPasswordFormProps {
  title?: string;
  titleId?: string;
  className?: string;
  submitLabel?: string;
  onSuccess?: () => void;
  backLink?: React.ReactNode;
}

export interface UseForgotPasswordFormParams {
  onSuccess?: () => void;
}

export interface UseForgotPasswordFormReturn {
  email: string;
  handleEmailChange: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
}

export type ValidateForgotPasswordFormParams = {
  email: string;
};

export type ValidateForgotPasswordFormResult = { isValid: boolean; message?: string };
