import type { FormEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useRegister } from '@vassembly/ui-api-hooks';
import { useSnackbar } from '@vassembly/ui-snackbar';
import { useUserAuth } from '@vassembly/ui-user-auth';
import { useRegisterFormCompletionEffect } from './useRegisterFormCompletionEffect';
import { validatePasswordStrength } from './validatePasswordStrength';
import { validateRegisterForm } from './validateRegisterForm';
import type { UseRegisterFormParams, UseRegisterFormReturn } from './types';

export const useRegisterForm = (params: UseRegisterFormParams): UseRegisterFormReturn => {
  const { returnUrl, fallbackPath, verificationPendingPath, onRedirect, onSuccess } = params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const register = useRegister();
  const { setSession } = useUserAuth();
  const snackbar = useSnackbar();
  const completionPendingRef = useRef(false);
  const passwordStrength = useMemo(() => validatePasswordStrength(password), [password]);
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
  }, []);
  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
  }, []);
  const handleConfirmPasswordChange = useCallback((value: string) => {
    setConfirmPassword(value);
  }, []);
  const handleFirstNameChange = useCallback((value: string) => {
    setFirstName(value);
  }, []);
  const handleLastNameChange = useCallback((value: string) => {
    setLastName(value);
  }, []);
  const handleAcceptedPrivacyPolicyChange = useCallback((isChecked: boolean) => {
    setAcceptedPrivacyPolicy(isChecked);
  }, []);
  const handleAcceptedTermsChange = useCallback((isChecked: boolean) => {
    setAcceptedTerms(isChecked);
  }, []);
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (register.isLoading) {
        return;
      }
      const validation = validateRegisterForm({
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        acceptedPrivacyPolicy,
        acceptedTerms,
      });
      if (validation.isValid === false) {
        snackbar.show({
          message: validation.message ?? 'Unable to submit registration.',
          variant: 'error',
        });
        return;
      }
      completionPendingRef.current = true;
      await register.fetch({
        body: {
          email: email.trim(),
          password: password.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      });
    },
    [
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      acceptedPrivacyPolicy,
      acceptedTerms,
      register,
      snackbar,
    ],
  );
  useRegisterFormCompletionEffect({
    register,
    completionPendingRef,
    snackbar,
    setSession,
    returnUrl,
    fallbackPath,
    verificationPendingPath,
    onRedirect,
    onSuccess,
  });
  return {
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    acceptedPrivacyPolicy,
    acceptedTerms,
    passwordStrength,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleFirstNameChange,
    handleLastNameChange,
    handleAcceptedPrivacyPolicyChange,
    handleAcceptedTermsChange,
    handleSubmit,
    isLoading: register.isLoading,
  };
};
