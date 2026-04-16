'use client';

import { Header } from '../../../ui/header/src';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { AppHeaderProps } from './types';
import styles from './AppHeader.module.scss';

export const AppHeader = ({ isDrawerOpen, onDrawerOpenChange }: AppHeaderProps): JSX.Element => {
  const pathname = usePathname();

  const handleMenuPress = useCallback(() => {
    onDrawerOpenChange(!isDrawerOpen);
  }, [isDrawerOpen, onDrawerOpenChange]);

  return (
    <Header
      id="app-header"
      isSticky
      logo={
        <Link href="/" className={styles.wordmark}>
          Vassembly
        </Link>
      }
      onMenuPress={handleMenuPress}
      isMenuOpen={isDrawerOpen}
      menuSurfaceId="app-navigation-drawer"
      navLinks={[
        { label: 'Home', href: '/', isActive: pathname === '/' },
        { label: 'Docs', href: '/docs', isActive: pathname === '/docs' },
      ]}
    />
  );
};

AppHeader.displayName = 'AppHeader';
