import type { ReactNode } from 'react';
import type { FooterProps } from '@vassembly/ui-footer';
import type { DrawerBranding, DrawerUser, NavSection } from '@vassembly/ui-drawer-navigation';

export type LayoutVariant = 'main';

export interface LayoutHeaderLogoPreset {
  href: string;
  text: string;
}

export interface LayoutHeaderPreset {
  id: string;
  isSticky: boolean;
  menuSurfaceId: string;
  navLinks: ReadonlyArray<{ label: string; href: string }>;
  logo: LayoutHeaderLogoPreset;
}

export interface LayoutDrawerPreset {
  user?: DrawerUser;
  sections: ReadonlyArray<NavSection>;
  branding?: DrawerBranding;
  isAuthenticated: boolean;
  onLogin: () => void;
  onRegister: () => void;
}

export interface LayoutPreset {
  footer: FooterProps;
  header: LayoutHeaderPreset;
  drawer: LayoutDrawerPreset;
}

export interface LayoutProps {
  variant: LayoutVariant;
  children: ReactNode;
  className?: string;
  footer?: Partial<FooterProps>;
  header?: Partial<LayoutHeaderPreset>;
  drawer?: Partial<LayoutDrawerPreset>;
}
