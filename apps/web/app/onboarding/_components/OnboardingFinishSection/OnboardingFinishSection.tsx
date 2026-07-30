'use client';

import { Button } from '@vassembly/ui-system-design/button';
import { Text } from '@vassembly/ui-system-design/text';

import styles from './OnboardingFinishSection.module.scss';

export interface OnboardingFinishSectionProps {
  canFinish: boolean;
  isFinishing: boolean;
  errorMessage: string | null;
  onFinish: () => void;
}

export const OnboardingFinishSection = ({
  canFinish,
  isFinishing,
  errorMessage,
  onFinish,
}: OnboardingFinishSectionProps): JSX.Element | null => {
  if (!canFinish) {
    return null;
  }

  return (
    <section className={styles.container} aria-label="Finish onboarding">
      <div className={styles.copy}>
        <Text variant="h3" as="h2">
          You are ready to use Vassembly
        </Text>
        <Text variant="body1">
          Required setup is complete. Review optional MCP connections above, then finish onboarding
          to access the rest of the app.
        </Text>
      </div>
      {errorMessage ? (
        <Text variant="body2" className={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}
      <Button
        variant="contained"
        text="Finish onboarding"
        isLoading={isFinishing}
        isDisabled={isFinishing}
        onClick={onFinish}
      />
    </section>
  );
};
