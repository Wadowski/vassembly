import type { ReactNode } from 'react';

export type OnboardingStepStatus = 'pending' | 'verified' | 'locked' | 'active' | 'done';

export interface OnboardingStepCardProps {
  stepNumber: 1 | 2 | 3;
  title: string;
  description: string;
  status: OnboardingStepStatus;
  statusBadgeLabel?: string;
  isLocked: boolean;
  body: ReactNode;
  footer?: ReactNode;
}
