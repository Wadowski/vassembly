import type { HTMLAttributes, ReactNode } from 'react';

export type StepState = 'completed' | 'current' | 'upcoming';

export interface StepperStep {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
}

export type StepperProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  steps: readonly StepperStep[];
  currentStepIndex: number;
  ariaLabel?: string;
};

export type StepperItemProps = {
  step: StepperStep;
  state: StepState;
  isLast: boolean;
};
