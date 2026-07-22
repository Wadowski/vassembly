import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '@vassembly/ui-system-design/button';
import { Text } from '@vassembly/ui-system-design/text';
import { TextField } from '@vassembly/ui-system-design/text-field';
import { resolveClassName } from '@vassembly/ui-system-design/utils';

import { DEFAULT_FORGOT_PASSWORD_SUBMIT_LABEL, DEFAULT_FORGOT_PASSWORD_SUCCESS_BODY } from './constants';
import styles from './ForgotPasswordForm.module.scss';
import { useForgotPasswordForm } from './useForgotPasswordForm';
import type { ForgotPasswordFormProps } from './types';
import { ArrowLeftIcon } from '@vassembly/ui-system-design/icons';

export const ForgotPasswordForm = (props: ForgotPasswordFormProps) => {
  const { title, titleId, className, submitLabel, onSuccess } = props;
  const { email, handleEmailChange, handleSubmit, isLoading, isSuccess } = useForgotPasswordForm({ onSuccess });

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>): void => {
    void handleSubmit(event);
  };
  const handleEmailInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    handleEmailChange(event.target.value);
  };
  const formAriaDescribedBy = title && titleId ? titleId : undefined;

  if (isSuccess) {
    return (
      <section className={resolveClassName(styles.container, className)}>
        <div
          className={styles.successMessage}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <Text variant="body1">{DEFAULT_FORGOT_PASSWORD_SUCCESS_BODY}</Text>
        </div>
      </section>
    );
  }

  return (
    <section className={resolveClassName(styles.container, className)}>
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
        {title ? (
          <Text variant="h1" id={titleId} className={styles.title}>
            {title}
          </Text>
        ) : null}
        <TextField
          type="email"
          label="Email"
          value={email}
          onChange={handleEmailInputChange}
          isDisabled={isLoading}
          isFullWidth
          size="large"
          autoComplete="email"
          inputMode="email"
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
          text={submitLabel ?? DEFAULT_FORGOT_PASSWORD_SUBMIT_LABEL}
        />
      </form>
    </section>
  );
};
