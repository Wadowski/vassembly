'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useGetUser, useAiIntegrations, useHttpClient } from '@vassembly/ui-api-hooks';
import { useUserAuth, parseOnboardingCompleted } from '@vassembly/ui-user-auth';
import { resolvePostRegisterTargetUrl } from '@vassembly/ui-register-form';

import { setTokens, getTokens } from '../../../lib/auth/sessionStorage';
import type { RefObject } from 'react';

import type { OnboardingSteps } from './types';

export const resolveOnboardingCurrentStepIndex = ({
  emailVerified,
  aiIntegrationCreated,
}: OnboardingSteps): number => {
  if (aiIntegrationCreated) {
    return 2;
  }
  if (emailVerified) {
    return 1;
  }
  return 0;
};

export interface UseOnboardingHubResult {
  email: string;
  steps: OnboardingSteps;
  currentStepIndex: number;
  isLoading: boolean;
  returnUrlRef: RefObject<string | null>;
}

export const useOnboardingHub = (): UseOnboardingHubResult => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useUserAuth();
  const httpClient = useHttpClient();
  const returnUrlRef = useRef<string | null>(searchParams.get('returnUrl'));
  const completionHandledRef = useRef(false);

  const { data: userData, isLoading: isUserLoading } = useGetUser({
    userId: user?.id ?? '',
  });
  const { fetch: fetchIntegrations, data: integrationsData, isLoading: isIntegrationsLoading } =
    useAiIntegrations();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }
    void fetchIntegrations({ page: 1, size: 1, status: 'active' });
  }, [fetchIntegrations, isAuthenticated, user?.id]);

  const emailVerified = userData?.user?.verifiedAt != null;
  const aiIntegrationCreated = (integrationsData?.totalCount ?? 0) >= 1;
  const isComplete = userData?.user?.onboarding?.completedAt != null;

  const steps: OnboardingSteps = {
    emailVerified,
    aiIntegrationCreated,
  };

  const currentStepIndex = resolveOnboardingCurrentStepIndex({
    emailVerified,
    aiIntegrationCreated,
  });

  const handleCompletion = useCallback(async (): Promise<void> => {
    if (completionHandledRef.current) {
      return;
    }
    completionHandledRef.current = true;

    const authResult = await httpClient.post<object, { authToken: string; refreshToken: string }>({
      path: '/auth',
      body: {},
      withAuth: true,
    });
    if (!authResult) {
      completionHandledRef.current = false;
      return;
    }

    setTokens({
      authToken: authResult.authToken,
      refreshToken: authResult.refreshToken,
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fallbackPath = '/';
    const storedReturnUrl = returnUrlRef.current;
    const { href } = resolvePostRegisterTargetUrl({
      returnUrl: storedReturnUrl,
      fallbackPath,
      origin,
    });

    router.replace(href);
  }, [httpClient, router]);

  useEffect(() => {
    if (!isComplete || !isAuthenticated) {
      return;
    }
    void handleCompletion();
  }, [handleCompletion, isComplete, isAuthenticated]);

  useEffect(() => {
    const tokens = getTokens();
    if (tokens.authToken && user) {
      const onboardingCompleted = parseOnboardingCompleted({ authToken: tokens.authToken });
      if (onboardingCompleted && isComplete) {
        router.replace('/');
      }
    }
  }, [isComplete, router, user]);

  return {
    email: userData?.user?.email ?? user?.email ?? '',
    steps,
    currentStepIndex,
    isLoading: isUserLoading || isIntegrationsLoading,
    returnUrlRef,
  };
};
