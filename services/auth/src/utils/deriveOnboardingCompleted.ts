export interface DeriveOnboardingCompletedParams {
  user: {
    onboarding?: {
      completedAt?: Date | string | null;
    };
  };
}

export const deriveOnboardingCompleted = ({
  user,
}: DeriveOnboardingCompletedParams): boolean => {
  return user.onboarding === undefined || user.onboarding.completedAt != null;
};
