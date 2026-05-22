'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedAuthRouteProps {
  children: ReactNode;
  requireAuthenticated?: boolean;
  redirectPath?: string;
  loadingFallback?: ReactNode;
}

export const ProtectedAuthRoute = ({
  children,
  requireAuthenticated = false,
  redirectPath = '/',
  loadingFallback = null,
}: ProtectedAuthRouteProps) => {
  const { isAuthenticated, bootstrapLoading } = useUserAuth();
  const router = useRouter();

  useEffect(() => {
    if (bootstrapLoading) {
      return;
    }

    if (requireAuthenticated && !isAuthenticated) {
      router.replace(redirectPath);
    }
    if (!requireAuthenticated && isAuthenticated) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, bootstrapLoading, router, requireAuthenticated, redirectPath]);

  if (bootstrapLoading) {
    return <>{loadingFallback}</>;
  }

  if ((requireAuthenticated && !isAuthenticated) || (!requireAuthenticated && isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
};
