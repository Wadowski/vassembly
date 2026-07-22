import { TextField } from '@vassembly/ui-system-design/text-field';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import styles from './RegisterForm.module.scss';
import type { PasswordStrengthResult } from './types';

export interface RegisterFormPasswordBlockProps {
  password: string;
  confirmPassword: string;
  passwordStrength: PasswordStrengthResult;
  handlePasswordChange: (value: string) => void;
  handleConfirmPasswordChange: (value: string) => void;
  isLoading: boolean;
}

export const RegisterFormPasswordBlock = (props: RegisterFormPasswordBlockProps) => {
  const {
    password,
    confirmPassword,
    passwordStrength,
    handlePasswordChange,
    handleConfirmPasswordChange,
    isLoading,
  } = props;
  const tfProps = { isDisabled: isLoading, isFullWidth: true, size: 'large' as const };

  return (
    <>
      <TextField
        type="password"
        label="Password"
        value={password}
        onChange={(e) => {
          handlePasswordChange(e.target.value);
        }}
        {...tfProps}
        autoComplete="new-password"
      />
      <PasswordStrengthIndicator strength={passwordStrength} className={styles.strengthIndicator} />
      <TextField
        type="password"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => {
          handleConfirmPasswordChange(e.target.value);
        }}
        {...tfProps}
        autoComplete="new-password"
      />
    </>
  );
};
