import { ForbiddenError } from '@vassembly/errors';

export interface EnforceOnboardingCompleteParams {
  onboardingCompleted: boolean;
  role?: string;
}

export const enforceOnboardingComplete = ({
  onboardingCompleted,
  role,
}: EnforceOnboardingCompleteParams): void => {
  if (role === 'admin') {
    return;
  }

  if (onboardingCompleted === false) {
    throw new ForbiddenError('Onboarding incomplete');
  }
};
