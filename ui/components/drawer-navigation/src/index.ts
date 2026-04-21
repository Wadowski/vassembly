export { DrawerNavigation } from './DrawerNavigation';
export { DrawerShell } from './shell/DrawerShell';
export { DrawerOverlay } from './overlay/DrawerOverlay';
export { NavSectionLabel } from './nav-items/NavSectionLabel';
export { NavLinkRow } from './nav-items/NavLinkRow';
export { NavCollapsibleGroup } from './nav-group/NavCollapsibleGroup';
export { NavListItems } from './navigation/NavListItems';
export { DrawerFooterAuth } from './footer/DrawerFooterAuth';
export { DrawerFooterUser } from './footer/DrawerFooterUser';
export { DrawerNavigationNav } from './navigation/DrawerNavigationNav';
export { DrawerBrandingHeader } from './header/DrawerBrandingHeader';
export type {
  NavIconComponent,
  DrawerBranding,
  DrawerNavigateEvent,
  DrawerNavigationCommonProps,
  DrawerNavigationOverlayProps,
  DrawerNavigationPersistentProps,
  DrawerNavigationProps,
  DrawerOpenChangeEvent,
  DrawerOverlayCloseReason,
  DrawerUser,
  NavBadge,
  NavGroupItem,
  NavLinkItem,
  NavMatchMode,
  NavSection,
  NavigateReason,
} from './types';
export { flattenNavLinks, pickActiveLinkId, defaultHrefMatchesPath, isLinkActiveByDefault } from './utils/matchActiveNavItem';
export { useDrawerExpandedGroups } from './utils/useDrawerExpandedGroups';
export { useDrawerActiveLink } from './utils/useDrawerActiveLink';
export { useReducedMotion } from './utils/useReducedMotion';
