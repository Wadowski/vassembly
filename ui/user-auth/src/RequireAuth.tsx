import { useMemo, ReactNode } from 'react';
import { useUserAuth } from './useUserAuth';
import { RequireAuthProps } from './types';
import { hasRoleAccess } from './requireAuthUtils';

export function RequireAuth({
  children,
  fallback,
  roles,
  match = 'any',
  loading,
  showFallbackWhenLoading = true,
}: RequireAuthProps): ReactNode {
  const { status, isAuthenticated, roles: userRoles } = useUserAuth();

  const isAuthorized = useMemo(
    () =>
      isAuthenticated &&
      hasRoleAccess({
        userRoles,
        requiredRoles: roles,
        match,
      }),
    [isAuthenticated, userRoles, roles, match],
  );

  if (status === 'loading') {
    if (loading !== undefined) {
      return <>{loading}</>;
    }
    if (showFallbackWhenLoading) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
