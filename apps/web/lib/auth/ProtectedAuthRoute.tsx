'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

type ProtectedRole = 'admin' | 'user';

interface ProtectedAuthRouteProps {
  children: ReactNode;
  requireAuthenticated?: boolean;
  redirectPath?: string;
  loadingFallback?: ReactNode;
  roles?: ProtectedRole[];
  forbiddenFallback?: ReactNode;
}

const normalizeRole = (role: string): string => role.trim().toLowerCase();

const hasRequiredRole = ({
  requiredRoles,
  userRole,
}: {
  requiredRoles: ProtectedRole[];
  userRole: string;
}): boolean => {
  const normalizedUserRole = normalizeRole(userRole);
  return requiredRoles.some((role) => normalizeRole(role) === normalizedUserRole);
};

export const ProtectedAuthRoute = ({
  children,
  requireAuthenticated = false,
  redirectPath = '/',
  loadingFallback = null,
  roles,
  forbiddenFallback = null,
}: ProtectedAuthRouteProps) => {
  const { isAuthenticated, bootstrapLoading, role } = useUserAuth();
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

  if (roles !== undefined && roles.length > 0 && !hasRequiredRole({ requiredRoles: roles, userRole: role })) {
    return <>{forbiddenFallback}</>;
  }

  return <>{children}</>;
};
