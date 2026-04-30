'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';
import { Layout } from '@vassembly/ui-layout';
import React from 'react';
import type { LayoutDrawerPreset } from '@vassembly/ui-layout';
import type { DrawerUser } from '@vassembly/ui-drawer-navigation';
import { useRouter, usePathname } from 'next/navigation';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isAuthenticated, user } = useUserAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogin = React.useCallback(() => {
    const returnUrl = encodeURIComponent(pathname);
    router.push(`/login?returnUrl=${returnUrl}`);
  }, [pathname, router]);

  const handleRegister = React.useCallback(() => {
    router.push('/register');
  }, [router]);

  const drawerUser: DrawerUser = {
    displayName: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    email: user?.email ?? '',
    roleLabel: user?.role ?? 'User',
  };

  const drawerConfig: Partial<LayoutDrawerPreset> = {
    isAuthenticated,
    user: drawerUser,
    onLogin: handleLogin,
    onRegister: handleRegister,
  };

  return (
    <Layout variant="main" drawer={drawerConfig}>
      {children}
    </Layout>
  );
};
