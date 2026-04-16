'use client';

import { useState } from 'react';
import { AppHeader } from './AppHeader';
import { AppDrawer } from './AppDrawer';

interface LayoutContentProps {
  children: React.ReactNode;
}

export const LayoutContent = ({ children }: LayoutContentProps): JSX.Element => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <AppHeader isDrawerOpen={isDrawerOpen} onDrawerOpenChange={setIsDrawerOpen} />
      <AppDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
      {children}
    </>
  );
};

LayoutContent.displayName = 'LayoutContent';
