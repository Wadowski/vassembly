import type { FormEvent } from 'react';
import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';
import { TextField } from '@vassembly/ui-text-field';
import { RegisterFormPasswordBlock } from './RegisterFormPasswordBlock';
import styles from './RegisterForm.module.scss';
import type { RegisterFormFieldsProps } from './types';

export const RegisterFormFields = (props: RegisterFormFieldsProps) => {
  const {
    titleId,
    submitLabel,
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    passwordStrength,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleFirstNameChange,
    handleLastNameChange,
    handleSubmit,
    isLoading,
  } = props;
  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    handleSubmit(event);
  };
  const tfProps = { isDisabled: isLoading, isFullWidth: true, size: 'large' as const };

  return (
    <form role="form" onSubmit={submitForm} className={styles.form}>
      {titleId ? (
        <Text variant="h1" id={titleId} className={styles.title}>
          Create Account
        </Text>
      ) : null}
      <Text>
        Already have an account?
        <Button as="a" variant="text" href="/login" text="Sign in" />
      </Text>
      <TextField
        type="email"
        label="Email"
        value={email}
        onChange={(e) => {
          handleEmailChange(e.target.value);
        }}
        {...tfProps}
        autoComplete="email"
        inputMode="email"
        aria-describedby={titleId}
      />
      <TextField
        label="First Name"
        value={firstName}
        onChange={(e) => {
          handleFirstNameChange(e.target.value);
        }}
        {...tfProps}
        autoComplete="given-name"
      />
      <TextField
        label="Last Name"
        value={lastName}
        onChange={(e) => {
          handleLastNameChange(e.target.value);
        }}
        {...tfProps}
        autoComplete="family-name"
      />
      <RegisterFormPasswordBlock
        password={password}
        confirmPassword={confirmPassword}
        passwordStrength={passwordStrength}
        handlePasswordChange={handlePasswordChange}
        handleConfirmPasswordChange={handleConfirmPasswordChange}
        isLoading={isLoading}
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
        text={submitLabel ?? 'Create account'}
      />
    </form>
  );
};
