import type { FormEvent } from 'react';
import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './LoginForm.module.scss';
import { useLoginForm } from './useLoginForm';
import type { LoginFormProps } from './types';

export const LoginForm = (props: LoginFormProps) => {
  const { titleId, className, submitLabel, returnUrl, fallbackPath, onRedirect, onSuccess } = props;
  const { email, password, handleEmailChange, handlePasswordChange, handleSubmit, isLoading } =
    useLoginForm({ returnUrl, fallbackPath, onRedirect, onSuccess });

  return (
    <section className={resolveClassName(styles.container, className)}>
      <form
        role="form"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          void handleSubmit(event);
        }}
        className={styles.form}
      >
        {titleId ? (
          <Text variant="h1" id={titleId} className={styles.title}>
            Sign in
          </Text>
        ) : null}
        <Text>
          Don&apos;t have an account?{" "}
          <Button as="a" variant="text" href="/register" text="Register" />
        </Text>
        <TextField
          type="email"
          label="Email"
          value={email}
          onChange={(event) => {
            handleEmailChange(event.target.value);
          }}
          isDisabled={isLoading}
          isFullWidth
          size="large"
          autoComplete="email"
          inputMode="email"
          aria-describedby={titleId}
        />
        <TextField
          type="password"
          label="Password"
          value={password}
          onChange={(event) => {
            handlePasswordChange(event.target.value);
          }}
          isDisabled={isLoading}
          isFullWidth
          size="large"
          autoComplete="current-password"
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
          text={submitLabel ?? 'Sign in'}
        />
        <Button as="a" variant="text" href="/forgot-password" text="Forgot password?" isFullWidth />
      </form>
    </section>
  );
};
