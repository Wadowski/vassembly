'use client';

import { useEffect, useRef, useState } from 'react';

import { OnboardingPageHeader } from './OnboardingPageHeader';
import { OnboardingProgressPanel } from './OnboardingProgressPanel';
import { OnboardingSkeleton } from './OnboardingSkeleton';
import { EmailVerificationStep } from './EmailVerificationStep';
import { AiIntegrationStep } from './AiIntegrationStep';
import { useOnboardingHub } from './useOnboardingHub';
import styles from './OnboardingHub.module.scss';

export const OnboardingHub = (): JSX.Element => {
  const { email, steps, currentStepIndex, isLoading } = useOnboardingHub();
  const [liveMessage, setLiveMessage] = useState('');
  const previousEmailVerifiedRef = useRef(steps.emailVerified);

  useEffect(() => {
    if (!previousEmailVerifiedRef.current && steps.emailVerified) {
      setLiveMessage('Email verified. Step 1 complete.');
    }
    previousEmailVerifiedRef.current = steps.emailVerified;
  }, [steps.emailVerified]);

  if (isLoading) {
    return <OnboardingSkeleton />;
  }

  return (
    <main className={styles.container}>
      <OnboardingPageHeader />
      <div className={styles.liveRegion} aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      <div className={styles.layoutSplit}>
        <div className={styles.progressColumn}>
          <OnboardingProgressPanel currentStepIndex={currentStepIndex} />
        </div>
        <div className={styles.contentColumn}>
          <EmailVerificationStep email={email} isComplete={steps.emailVerified} />
          <AiIntegrationStep
            isLocked={!steps.emailVerified}
            isComplete={steps.aiIntegrationCreated}
          />
        </div>
      </div>
    </main>
  );
};
