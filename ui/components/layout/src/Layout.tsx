'use client';

import { DrawerNavigation } from '@vassembly/ui-drawer-navigation';
import { Footer } from '@vassembly/ui-footer';
import { Header } from '@vassembly/ui-header';
import type { DrawerNavigateEvent, DrawerOpenChangeEvent } from '@vassembly/ui-drawer-navigation';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { buildHeaderNavLinks } from './buildHeaderNavLinks';
import styles from './Layout.module.scss';
import { resolveLayoutConfig } from './resolveLayoutConfig';
import type { LayoutProps } from './types';

export const Layout = ({
  variant,
  children,
  className,
  footer,
  header,
  drawer,
}: LayoutProps): JSX.Element => {
  const router = useRouter();
  const config = useMemo(
    () => resolveLayoutConfig({ variant, footer, header, drawer }),
    [variant, footer, header, drawer],
  );
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const navLinks = useMemo(
    () => buildHeaderNavLinks({ pathname, links: config.header.navLinks }),
    [config.header.navLinks, pathname],
  );
  
  const handleMenuPress = useCallback(() => {
    setIsDrawerOpen((open) => !open);
  }, []);
  
  const handleNavigate = useCallback((_event: DrawerNavigateEvent) => {
    setIsDrawerOpen(false);
  }, []);
  
  const handleOpenChange = useCallback((event: DrawerOpenChangeEvent) => {
    setIsDrawerOpen(event.isOpen);
  }, []);
  
  const handleLogin = useCallback(() => {
    setIsDrawerOpen(false);
    const returnUrl = encodeURIComponent(pathname);
    router.push(`/login?returnUrl=${returnUrl}`);
  }, [pathname, router]);
  
  const handleRegister = useCallback(() => {
    setIsDrawerOpen(false);
    router.push('/register');
  }, [router]);
  
  const handleLogout = useCallback(async () => {
    setIsDrawerOpen(false);
    await config.drawer.onLogout?.();
  }, [config.drawer]);

  const handleOpenSettings = useCallback(() => {
    setIsDrawerOpen(false);
    config.drawer.onOpenSettings?.();
  }, [config.drawer]);
  
  const pageClassName = className
    ? `${styles.page} ${className}`
    : styles.page;

  return (
    <>
      <Header
        id={config.header.id}
        isSticky={config.header.isSticky}
        logo={
          <Link href={config.header.logo.href} className={styles.wordmark}>
            {config.header.logo.text}
          </Link>
        }
        onMenuPress={handleMenuPress}
        isMenuOpen={isDrawerOpen}
        menuSurfaceId={config.header.menuSurfaceId}
        navLinks={navLinks}
      />
      <DrawerNavigation
        layout="overlay"
        isOpen={isDrawerOpen}
        onOpenChange={handleOpenChange}
        user={config.drawer.user}
        sections={config.drawer.sections}
        currentPath={pathname}
        isAuthenticated={config.drawer.isAuthenticated}
        onNavigate={handleNavigate}
        branding={config.drawer.branding}
        LinkComponent={Link}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onOpenSettings={handleOpenSettings}
      />
      <div className={pageClassName}>
        <main id="main-content" className={styles.main}>
          {children}
        </main>
        <Footer {...config.footer} />
      </div>
    </>
  );
};

Layout.displayName = 'Layout';
