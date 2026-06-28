import { ONBOARDING_GRAPHQL_ALLOWED_QUERIES } from '@vassembly/constants';

import { enforceOnboardingComplete } from '../../routes/shared/enforceOnboardingComplete';
import type { ApiGraphQLContext } from './types';

export interface EnforceOnboardingCompleteForQueryParams {
  queryName: string;
  context: ApiGraphQLContext;
}

export const enforceOnboardingCompleteForQuery = ({
  queryName,
  context,
}: EnforceOnboardingCompleteForQueryParams): void => {
  if (ONBOARDING_GRAPHQL_ALLOWED_QUERIES.has(queryName)) {
    return;
  }

  enforceOnboardingComplete({
    onboardingCompleted: context.onboardingCompleted ?? true,
    role: context.role,
  });
};
