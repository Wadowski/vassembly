import aiIntegrationDomain from '@vassembly/domain-ai-integration';
import userDomain from '@vassembly/domain-user';

import { getUser } from '../getUser';
import type { CheckAndCompleteOnboardingInput } from './types';

export const checkAndCompleteOnboarding = async ({
  userId,
}: CheckAndCompleteOnboardingInput): Promise<void> => {
  const { user } = await getUser({ id: userId });

  if (user.onboarding?.completedAt != null || user.onboarding === undefined) {
    return;
  }

  if (user.verifiedAt == null) {
    return;
  }

  const { totalCount } = await aiIntegrationDomain.queries.getListForUser({
    userId,
    page: 1,
    size: 1,
    status: 'active',
  });

  if (totalCount === 0) {
    return;
  }

  await userDomain.commands.completeOnboarding({ userId });
};
