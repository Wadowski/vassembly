import { useCallback, useState } from 'react';

import { CommonError, InternalError } from '@vassembly/errors';

import { useHttpClient } from '../http/useHttpClient';

export interface FinishOnboardingResponse {
  success: boolean;
}

export interface FinishOnboardingMutationState {
  loading: boolean;
  error: CommonError | null;
}

export const useFinishOnboarding = (): readonly [
  () => Promise<FinishOnboardingResponse | undefined>,
  FinishOnboardingMutationState,
] => {
  const httpClient = useHttpClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CommonError | null>(null);

  const finishOnboarding = useCallback(async (): Promise<FinishOnboardingResponse | undefined> => {
    setLoading(true);
    setError(null);

    try {
      const response = await httpClient.post<object, FinishOnboardingResponse>({
        path: '/auth/onboarding/complete',
        body: {},
        withAuth: true,
      });

      return response;
    } catch (err) {
      const commonError =
        err instanceof CommonError
          ? err
          : new InternalError('Failed to finish onboarding. Please try again.', err);

      setError(commonError);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [httpClient]);

  return [finishOnboarding, { loading, error }] as const;
};
