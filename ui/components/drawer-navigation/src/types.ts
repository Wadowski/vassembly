import type { ComponentType, MouseEvent, RefObject, ReactNode, SVGProps } from 'react';

export type NavIconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export type NavMatchMode = 'exact' | 'prefix';

export type NavigateReason = 'link' | 'logo' | 'settings' | 'login' | 'register';

export type DrawerOverlayCloseReason = 'scrim' | 'escape' | 'programmatic';

export interface NavBadge {
  value: string;
  ariaLabel?: string;
}

export interface NavLinkItemBase {
  id: string;
  label: string;
  icon?: NavIconComponent;
  badge?: NavBadge;
  match?: NavMatchMode;
  isDisabled?: boolean;
}

export interface NavLinkItem extends NavLinkItemBase {
  kind: 'link';
  href: string;
  isExternal?: boolean;
}

export interface NavGroupItem {
  kind: 'group';
  id: string;
  label: string;
  icon?: NavIconComponent;
  defaultOpen?: boolean;
  children: ReadonlyArray<NavLinkItem | NavGroupItem>;
}

export interface NavSection {
  id: string;
  label: string;
  items: ReadonlyArray<NavLinkItem | NavGroupItem>;
}

export interface DrawerNavigateEvent {
  href: string;
  itemId: string;
  reason: NavigateReason;
}

export interface DrawerUser {
  displayName: string;
  email: string;
  avatarUrl?: string;
  initials?: string;
  roleLabel?: string;
}

export interface DrawerBranding {
  productName: string;
  tagline?: string;
  logo?: ReactNode;
}

export interface DrawerOpenChangeEvent {
  isOpen: boolean;
  reason: DrawerOverlayCloseReason;
}


export interface DrawerNavigationCommonProps {
  sections: ReadonlyArray<NavSection>;
  currentPath?: string;
  isActiveHref?: (args: {
    href: string;
    item: NavLinkItem;
    currentPath: string;
  }) => boolean;
  isAuthenticated: boolean;
  user?: DrawerUser;
  onNavigate: (event: DrawerNavigateEvent) => void;
  onLogout?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
  onOpenSettings?: () => void;
  branding?: DrawerBranding;
  mainNavAriaLabel?: string;
  className?: string;
  expandedGroupIds?: ReadonlySet<string>;
  onExpandedGroupIdsChange?: (ids: ReadonlySet<string>) => void;
  defaultExpandedGroupIds?: ReadonlySet<string>;
  openerRef?: RefObject<HTMLElement | null>;
  LinkComponent?: React.ComponentType<{ href: string; onClick: (event: MouseEvent<HTMLAnchorElement>) => void; className: string; children: ReactNode; target?: string; rel?: string; 'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean }>;
}

export interface DrawerNavigationPersistentProps extends DrawerNavigationCommonProps {
  layout: 'persistent';
}

export interface DrawerNavigationOverlayProps extends DrawerNavigationCommonProps {
  layout: 'overlay';
  isOpen: boolean;
  onOpenChange: (event: DrawerOpenChangeEvent) => void;
}

export type DrawerNavigationProps =
  | DrawerNavigationPersistentProps
  | DrawerNavigationOverlayProps;
