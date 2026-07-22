'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@vassembly/ui-system-design/button';
import { LockIcon } from '@vassembly/ui-system-design/icons';
import { Text } from '@vassembly/ui-system-design/text';

import { OnboardingStepCard } from './OnboardingStepCard';
import type { OnboardingStepStatus } from './OnboardingStepCard';
import styles from './AiIntegrationStep.module.scss';

export interface AiIntegrationStepProps {
  isLocked: boolean;
  isComplete: boolean;
}

const resolveStatus = ({
  isLocked,
  isComplete,
}: {
  isLocked: boolean;
  isComplete: boolean;
}): OnboardingStepStatus => {
  if (isComplete) {
    return 'done';
  }
  if (isLocked) {
    return 'locked';
  }
  return 'active';
};

export const AiIntegrationStep = ({
  isLocked,
  isComplete,
}: AiIntegrationStepProps): JSX.Element => {
  const router = useRouter();
  const status = resolveStatus({ isLocked, isComplete });

  const handleAddIntegrationClick = (): void => {
    router.push('/agents/ai-integrations/create');
  };

  const body = isLocked ? (
    <div className={styles.lockMessage}>
      <LockIcon className={styles.lockIcon} aria-hidden />
      <Text variant="body2">Complete step 1 — verify your email first.</Text>
    </div>
  ) : (
    <div className={styles.bodyStack}>
      <Text variant="body1">Connect OpenAI, Anthropic, or another supported provider.</Text>
      {isComplete ? (
        <Text variant="body2">Your first AI integration is connected.</Text>
      ) : null}
    </div>
  );

  const footer = isComplete ? undefined : (
    <>
      <Text variant="body2" className={styles.footerHint}>
        {isLocked ? 'Available after email verification' : 'Takes about a minute to set up'}
      </Text>
      <div className={styles.footerActions}>
        <Button
          variant="contained"
          text="Add AI integration"
          isDisabled={isLocked}
          onClick={handleAddIntegrationClick}
        />
      </div>
    </>
  );

  return (
    <OnboardingStepCard
      stepNumber={2}
      title="Create first AI integration"
      description="Connect an AI provider to use platform agents."
      status={status}
      isLocked={isLocked}
      body={body}
      footer={footer}
    />
  );
};
