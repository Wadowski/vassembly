import type { FormEvent } from 'react';
import type { AuthUser } from '@vassembly/ui-user-auth';

export type LoginFormSubmitResult = {
  authToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginNavigateFn = (href: string) => void;

export interface LoginFormProps {
  titleId?: string;
  className?: string;
  submitLabel?: string;
  returnUrl?: string | null;
  fallbackPath?: string;
  onRedirect?: LoginNavigateFn;
  onSuccess?: (result: LoginFormSubmitResult) => void;
}

export type ValidateLoginFormParams = {
  email: string;
  password: string;
};

export type ValidateLoginFormResult =
  | { isValid: boolean; message?: string };

export type ResolvePostLoginTargetUrlParams = {
  returnUrl: string | null | undefined;
  fallbackPath: string;
  origin: string;
};

export type ResolvePostLoginTargetUrlResult = {
  href: string;
};

export type MapLoginUserToAuthUserParams = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export interface UseLoginFormParams {
  returnUrl?: string | null;
  fallbackPath?: string;
  onRedirect?: LoginNavigateFn;
  onSuccess?: (result: LoginFormSubmitResult) => void;
}

export interface UseLoginFormReturn {
  email: string;
  password: string;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
}

export type { AuthUser };
