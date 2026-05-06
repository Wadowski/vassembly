import type { ChangeEvent, FormEvent } from 'react';
import { ArrowLeftIcon } from '@vassembly/ui-icons';
import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';
import { resolveClassName } from '@vassembly/ui-utils';

import { DEFAULT_RESET_PASSWORD_SUBMIT_LABEL, DEFAULT_RESET_PASSWORD_TITLE } from './constants';
import styles from './ResetPasswordForm.module.scss';
import { useResetPasswordForm } from './useResetPasswordForm';
import type { ResetPasswordFormProps } from './types';

export const ResetPasswordForm = (props: ResetPasswordFormProps) => {
  const { token, titleId, className, submitLabel, onSuccess } = props;
  const {
    password,
    confirmPassword,
    passwordError,
    confirmPasswordError,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handlePasswordBlur,
    handleConfirmBlur,
    handleSubmit,
    isLoading,
  } = useResetPasswordForm({ token, onSuccess });

  const resolvedClassName = resolveClassName(styles.container, className);
  const formAriaDescribedBy = titleId;

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>): void => {
    void handleSubmit(event);
  };

  const handlePasswordInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    handlePasswordChange(event.target.value);
  };

  const handleConfirmInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    handleConfirmPasswordChange(event.target.value);
  };

  const textFieldProps = {
    isDisabled: isLoading,
    isFullWidth: true,
    size: 'large' as const,
  };

  return (
    <section className={resolvedClassName}>
      <form
        role="form"
        aria-describedby={formAriaDescribedBy}
        onSubmit={handleFormSubmit}
        className={styles.form}
      >
        <Button
          as="a"
          variant="text"
          href="/login"
          text="Back to Sign in"
          icon={<ArrowLeftIcon />}
        />
        <Text variant="h1" id={titleId} className={styles.title}>
          {DEFAULT_RESET_PASSWORD_TITLE}
        </Text>
        <TextField
          type="password"
          label="New password"
          value={password}
          onChange={handlePasswordInputChange}
          onBlur={handlePasswordBlur}
          errorMessage={passwordError}
          autoComplete="new-password"
          {...textFieldProps}
          aria-describedby={titleId}
        />
        <TextField
          type="password"
          label="Confirm password"
          value={confirmPassword}
          onChange={handleConfirmInputChange}
          onBlur={handleConfirmBlur}
          errorMessage={confirmPasswordError}
          autoComplete="new-password"
          {...textFieldProps}
          aria-describedby={titleId}
        />
        <Button
          type="submit"
          color="primary"
          variant="contained"
          size="large"
          isFullWidth
          isLoading={isLoading}
          isDisabled={isLoading}
          aria-busy={isLoading}
          text={submitLabel ?? DEFAULT_RESET_PASSWORD_SUBMIT_LABEL}
        />
      </form>
    </section>
  );
};
