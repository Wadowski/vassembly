'use client';

import { Suspense } from 'react';

import { ProtectedAuthRoute } from '../../lib/auth/ProtectedAuthRoute';
import { OnboardingHub } from './_components/OnboardingHub';
import { OnboardingSkeleton } from './_components/OnboardingSkeleton';

export default function OnboardingPage(): JSX.Element {
  return (
    <ProtectedAuthRoute requireAuthenticated redirectPath="/login">
      <Suspense fallback={<OnboardingSkeleton />}>
        <OnboardingHub />
      </Suspense>
    </ProtectedAuthRoute>
  );
}
