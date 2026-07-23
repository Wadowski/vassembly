import { forwardRef } from 'react';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
import styles from './Stepper.module.scss';
import { StepperItem } from './StepperItem';
import type { StepperProps, StepState } from './types';

const getStepState = ({
  index,
  currentStepIndex,
}: {
  index: number;
  currentStepIndex: number;
}): StepState => {
  if (index < currentStepIndex) {
    return 'completed';
  }
  if (index === currentStepIndex) {
    return 'current';
  }
  return 'upcoming';
};

export const Stepper = forwardRef<HTMLElement, StepperProps>(
  ({ steps, currentStepIndex, className, ariaLabel = 'Progress steps', ...rest }, ref) => {
    return (
      <nav
        ref={ref}
        className={resolveClassName(styles.root, className)}
        aria-label={ariaLabel}
        {...rest}
      >
        <ol className={styles.list}>
          {steps.map((step, index) => (
            <StepperItem
              key={step.id}
              step={step}
              state={getStepState({ index, currentStepIndex })}
              isLast={index === steps.length - 1}
            />
          ))}
        </ol>
      </nav>
    );
  },
);

Stepper.displayName = 'Stepper';
