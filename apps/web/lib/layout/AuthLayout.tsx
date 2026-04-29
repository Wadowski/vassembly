'use client';

import { useUserAuth } from '@vassembly/ui-user-auth';
import { Layout } from '@vassembly/ui-layout';
import React from 'react';
import type { LayoutDrawerPreset } from '@vassembly/ui-layout';
import { useRouter, usePathname } from 'next/navigation';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isAuthenticated } = useUserAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogin = React.useCallback(() => {
    const returnUrl = encodeURIComponent(pathname);
    router.push(`/login?returnUrl=${returnUrl}`);
  }, [pathname, router]);

  const handleRegister = React.useCallback(() => {
    router.push('/register');
  }, [router]);

  const drawerConfig: Partial<LayoutDrawerPreset> = {
    isAuthenticated,
    onLogin: handleLogin,
    onRegister: handleRegister,
  };

  return (
    <Layout variant="main" drawer={drawerConfig}>
      {children}
    </Layout>
  );
};
