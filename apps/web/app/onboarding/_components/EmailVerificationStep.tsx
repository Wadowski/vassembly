'use client';

import { Button } from '@vassembly/ui-button';
import { Text } from '@vassembly/ui-text';

import { OnboardingStepCard } from './OnboardingStepCard';
import { useResendVerificationHandler } from './useResendVerification';
import styles from './EmailVerificationStep.module.scss';

export interface EmailVerificationStepProps {
  email: string;
  isComplete: boolean;
}

export const EmailVerificationStep = ({
  email,
  isComplete,
}: EmailVerificationStepProps): JSX.Element => {
  const { handleResend, isLoading, cooldownSeconds, errorMessage, successMessage } =
    useResendVerificationHandler();

  const status = isComplete ? 'verified' : 'pending';
  const isResendDisabled = isLoading || (cooldownSeconds != null && cooldownSeconds > 0);

  const handleResendClick = (): void => {
    void handleResend();
  };

  const body = isComplete ? (
    <div className={styles.bodyStack}>
      <Text variant="body1" className={styles.email}>
        {email}
      </Text>
      <Text variant="body2">Your email address is confirmed.</Text>
    </div>
  ) : (
    <div className={styles.bodyStack}>
      <Text variant="body1">
        We sent a verification link to <span className={styles.email}>{email}</span>
      </Text>
      <Text variant="body2">Check your inbox and spam folder.</Text>
    </div>
  );

  const footer = isComplete ? undefined : (
    <>
      <div className={styles.footerMessages}>
        {cooldownSeconds != null && cooldownSeconds > 0 ? (
          <Text variant="body2" className={styles.messageMuted}>
            Resend available in {cooldownSeconds}s
          </Text>
        ) : null}
        {errorMessage ? (
          <Text variant="body2" className={styles.messageError}>
            {errorMessage}
          </Text>
        ) : null}
        {successMessage ? (
          <Text variant="body2" className={styles.messageSuccess}>
            {successMessage}
          </Text>
        ) : null}
      </div>
      <div className={styles.footerActions}>
        <Button
          variant="outlined"
          text="Resend email"
          isDisabled={isResendDisabled}
          onClick={handleResendClick}
        />
      </div>
    </>
  );

  return (
    <OnboardingStepCard
      stepNumber={1}
      title="Verify email address"
      description="Confirm your email to secure your account."
      status={status}
      isLocked={false}
      body={body}
      footer={footer}
    />
  );
};
