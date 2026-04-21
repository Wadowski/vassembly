'use client';

import { DrawerNavigation } from '@vassembly/ui-drawer-navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { DrawerNavigateEvent, DrawerOpenChangeEvent } from '@vassembly/ui-drawer-navigation';
import styles from './AppDrawer.module.scss';
import { HouseIcon, LayoutDashboardIcon } from '@vassembly/ui-icons';

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
      id: 'workspace',
      label: 'Workspace',
      items: [
        {
          kind: 'link' as const,
          id: 'dash',
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboardIcon,
        },
        {
          kind: 'link' as const,
          id: 'home',
          label: 'Home',
          href: '/',
          icon: HouseIcon,
        },
      ],
    },
  ];

  return (
    <DrawerNavigation
      layout="overlay"
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      sections={sections}
      currentPath={pathname}
      isAuthenticated={false}
      onNavigate={handleNavigate}
      branding={{ productName: 'Vassembly', tagline: 'Your AI-powered workspace' }}
      LinkComponent={Link}
      onLogin={() => {}}
      onRegister={() => {}}
    />
  );
};

AppDrawer.displayName = 'AppDrawer';
