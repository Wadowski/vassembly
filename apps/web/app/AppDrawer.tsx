'use client';

import { DrawerNavigation } from '../../../ui/drawer-navigation/src';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { DrawerNavigateEvent, DrawerOpenChangeEvent, RenderNavLinkArgs } from '../../../ui/drawer-navigation/src';
import styles from './AppDrawer.module.scss';

interface AppDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const AppDrawer = ({ isOpen, onOpenChange }: AppDrawerProps): JSX.Element => {
  const pathname = usePathname();

  const handleNavigate = useCallback(
    (event: DrawerNavigateEvent) => {
      onOpenChange(false);
    },
    [onOpenChange]
  );

  const handleOpenChange = useCallback(
    (event: DrawerOpenChangeEvent) => {
      onOpenChange(event.isOpen);
    },
    [onOpenChange]
  );

  const sections = [
    {
      id: 'main-nav',
      label: 'Navigation',
      items: [
        {
          kind: 'link' as const,
          id: 'nav-home',
          label: 'Home',
          href: '/',
        },
        {
          kind: 'link' as const,
          id: 'nav-docs',
          label: 'Docs',
          href: '/docs',
        },
      ],
    },
  ];

  const renderLink = (args: RenderNavLinkArgs) => {
    const { href, onClick, children } = args;
    return (
      <Link href={href} onClick={onClick}>
        {children}
      </Link>
    );
  };

  return (
    <DrawerNavigation
      id="app-navigation-drawer"
      layout="overlay"
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      sections={sections}
      currentPath={pathname}
      isAuthenticated={false}
      onNavigate={handleNavigate}
      renderLink={renderLink}
      onLogin={() => {}}
      onRegister={() => {}}
    />
  );
};

AppDrawer.displayName = 'AppDrawer';
