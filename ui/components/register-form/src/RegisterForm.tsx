import { resolveClassName } from '@vassembly/ui-utils';
import { RegisterFormFields } from './RegisterFormFields';
import styles from './RegisterForm.module.scss';
import type { RegisterFormProps } from './types';
import { useRegisterForm } from './useRegisterForm';
import { validatePasswordStrength } from './validatePasswordStrength';

export const RegisterForm = (props: RegisterFormProps) => {
  const {
    titleId,
    className,
    submitLabel,
    returnUrl,
    fallbackPath,
    verificationPendingPath,
    onRedirect,
    onSuccess,
  } = props;
  const {
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    passwordStrength: strengthFromHook,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleFirstNameChange,
    handleLastNameChange,
    handleSubmit,
    isLoading,
  } = useRegisterForm({ returnUrl, fallbackPath, verificationPendingPath, onRedirect, onSuccess });
  const passwordStrength = strengthFromHook ?? validatePasswordStrength(password);

  return (
    <section className={resolveClassName(styles.container, className)}>
      <RegisterFormFields
        titleId={titleId}
        submitLabel={submitLabel}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        firstName={firstName}
        lastName={lastName}
        passwordStrength={passwordStrength}
        handleEmailChange={handleEmailChange}
        handlePasswordChange={handlePasswordChange}
        handleConfirmPasswordChange={handleConfirmPasswordChange}
        handleFirstNameChange={handleFirstNameChange}
        handleLastNameChange={handleLastNameChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </section>
  );
};
