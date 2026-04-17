import type { ReactNode } from 'react';

export interface HeaderNavLink {
  label: string;
  href: string;
  isActive?: boolean;
}

export interface HeaderRootProps {
  children: ReactNode;
  className?: string;
  id?: string;
  isSticky?: boolean;
}

export interface HeaderProps {
  logo: ReactNode;
  onMenuPress: () => void;
  isMenuOpen?: boolean;
  menuSurfaceId?: string;
  navLinks?: HeaderNavLink[];
  utilitiesSlot?: ReactNode;
  navAriaLabel?: string;
  menuAriaLabel?: string;
  className?: string;
  id?: string;
  isSticky?: boolean;
}

export interface HeaderBrandProps {
  children: ReactNode;
  className?: string;
}

export interface HeaderNavProps {
  links: HeaderNavLink[];
  navAriaLabel?: string;
  className?: string;
}

export interface HeaderUtilitiesProps {
  children?: ReactNode;
  className?: string;
}

export interface MenuTriggerCTAProps {
  onPress: () => void;
  isExpanded: boolean;
  controlsId?: string;
  className?: string;
  ariaLabel?: string;
}
