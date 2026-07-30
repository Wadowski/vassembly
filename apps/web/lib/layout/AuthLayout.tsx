'use client';

import type { DrawerUser } from '@vassembly/ui-drawer-navigation';
import { useLogout } from '@vassembly/ui-api-hooks';
import { Layout } from '@vassembly/ui-layout';
import type { LayoutDrawerPreset } from '@vassembly/ui-layout';
import { useUserAuth } from '@vassembly/ui-user-auth';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { clearTokens } from '../auth/sessionStorage';
import { clearStoredUserPreferences } from '../preferences';
import { OnboardingGate } from '../auth/OnboardingGate';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isAuthenticated, user, clearSession } = useUserAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { fetch: logout } = useLogout();

  const handleLogin = React.useCallback(() => {
    const returnUrl = encodeURIComponent(pathname);
    router.push(`/login?returnUrl=${returnUrl}`);
  }, [pathname, router]);

  const handleRegister = React.useCallback(() => {
    router.push('/register');
  }, [router]);

  const handleLogout = React.useCallback(async () => {
    const subjectId = user?.id;
    try {
      await logout({ body: {} });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      clearTokens();
      if (subjectId) clearStoredUserPreferences({ userId: subjectId });
      clearSession();
      router.push('/login');
    }
  }, [logout, clearSession, router, user?.id]);

  const handleOpenSettings = React.useCallback(() => {
    router.push('/settings');
  }, [router]);

  const drawerUser: DrawerUser = {
    displayName: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    email: user?.email ?? '',
    roleLabel: user?.role ?? 'User',
  };

  const drawerConfig: Partial<LayoutDrawerPreset> = {
    isAuthenticated,
    userRole: user?.role,
    user: drawerUser,
    onLogin: handleLogin,
    onRegister: handleRegister,
    onLogout: handleLogout,
    onOpenSettings: handleOpenSettings,
  };

  return (
    <OnboardingGate>
      <Layout variant="main" drawer={drawerConfig}>
        {children}
      </Layout>
    </OnboardingGate>
  );
};
