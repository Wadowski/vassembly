import aiIntegrationDomain from '@vassembly/domain-ai-integration';
import userDomain from '@vassembly/domain-user';
import { WrongParamError } from '@vassembly/errors';

import { getUser } from '../getUser';
import type { FinishOnboardingInput, FinishOnboardingOutput } from './types';

export const finishOnboarding = async ({
  userId,
}: FinishOnboardingInput): Promise<FinishOnboardingOutput> => {
  const { user } = await getUser({ id: userId });

  if (user.onboarding === undefined) {
    return { success: true };
  }

  if (user.onboarding.completedAt != null) {
    return { success: true };
  }

  if (user.verifiedAt == null) {
    throw new WrongParamError('Verify your email before finishing onboarding');
  }

  const { totalCount } = await aiIntegrationDomain.queries.getListForUser({
    userId,
    page: 1,
    size: 1,
    status: 'active',
  });

  if (totalCount === 0) {
    throw new WrongParamError('Add an AI integration before finishing onboarding');
  }

  await userDomain.commands.completeOnboarding({ userId });

  return { success: true };
};
