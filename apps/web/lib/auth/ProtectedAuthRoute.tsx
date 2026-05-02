'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedAuthRouteProps {
  children: ReactNode;
  requireAuthenticated?: boolean;
  redirectPath?: string;
}

export const ProtectedAuthRoute = ({
  children,
  requireAuthenticated = false,
  redirectPath = '/',
}: ProtectedAuthRouteProps) => {
  const { isAuthenticated } = useUserAuth();
  const router = useRouter();

  useEffect(() => {
    if (requireAuthenticated && !isAuthenticated) {
      router.replace(redirectPath);
    }
    if (!requireAuthenticated && isAuthenticated) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, router, requireAuthenticated, redirectPath]);

  if ((requireAuthenticated && !isAuthenticated) || (!requireAuthenticated && isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
};
