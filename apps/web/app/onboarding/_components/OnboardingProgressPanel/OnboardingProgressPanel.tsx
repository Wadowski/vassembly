'use client';

import { Stepper } from '@vassembly/ui-system-design/stepper';

import { ONBOARDING_STEPPER_STEPS } from '../onboardingStepperSteps';
import type { OnboardingProgressPanelProps } from './types';
import styles from './OnboardingProgressPanel.module.scss';

export const OnboardingProgressPanel = ({
  currentStepIndex,
}: OnboardingProgressPanelProps): JSX.Element => (
  <aside className={styles.panel} aria-label="Onboarding progress">
    <Stepper
      className={styles.stepper}
      steps={ONBOARDING_STEPPER_STEPS}
      currentStepIndex={currentStepIndex}
      ariaLabel="Onboarding progress"
    />
  </aside>
);
