import type { NavLinkItem, NavSection } from '@vassembly/ui-drawer-navigation';
import {
  HouseIcon,
  SearchIcon,
  SocialFacebookColorIcon,
  SocialInstagramColorIcon,
  SocialTwitterColorIcon,
  TagsIcon,
  TeamMeetingChatIcon,
} from '@vassembly/ui-system-design/icons';
import type { LayoutPreset } from '../types';

const noop = (): void => {};

const WORKSPACE_PUBLIC_NAV_ITEMS: ReadonlyArray<NavLinkItem> = [
  {
    kind: 'link',
    id: 'home',
    label: 'Home',
    href: '/',
    icon: HouseIcon,
  },
];

const WORKSPACE_AUTHENTICATED_NAV_ITEMS: ReadonlyArray<NavLinkItem> = [
  {
    kind: 'link',
    id: 'agents',
    label: 'Agents',
    href: '/agents',
    icon: TeamMeetingChatIcon,
  },
  {
    kind: 'link',
    id: 'mcps',
    label: 'MCPs',
    href: '/mcps',
    icon: SearchIcon,
  },
];
const WORKSPACE_NOTAUTHENTICATED_NAV_ITEMS: ReadonlyArray<NavLinkItem> = [];

const SPECIALIZATIONS_NAV_ITEM: NavLinkItem = {
  kind: 'link',
  id: 'specializations',
  label: 'Specializations',
  href: '/specialization',
  icon: TagsIcon,
};

export interface BuildMainDrawerSectionsParams {
  isAuthenticated: boolean;
  isAdmin?: boolean;
}

export const buildMainDrawerSections = ({
  isAuthenticated,
  isAdmin = false,
}: BuildMainDrawerSectionsParams): ReadonlyArray<NavSection> => [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      ...WORKSPACE_PUBLIC_NAV_ITEMS,
      ...(isAuthenticated ? WORKSPACE_AUTHENTICATED_NAV_ITEMS : WORKSPACE_NOTAUTHENTICATED_NAV_ITEMS),
      ...(isAuthenticated && isAdmin ? [SPECIALIZATIONS_NAV_ITEM] : []),
    ],
  },
];

export const MAIN_LAYOUT_PRESET: LayoutPreset = {
  footer: {
    sitemap: [
      { label: 'Home', href: '/' },
      { label: 'Docs', href: '/docs' },
    ],
    company: [{ label: 'About us', href: '/about' }],
    legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms & conditions', href: '/terms' },
    ],
    contact: {
      email: {
        label: 'Email',
        value: 'hello@vassembly.dev',
        href: 'mailto:hello@vassembly.dev',
      },
    },
    social: [
      {
        href: 'https://twitter.com',
        ariaLabel: 'X',
        icon: <SocialTwitterColorIcon />,
      },
      {
        href: 'https://facebook.com',
        ariaLabel: 'Facebook',
        icon: <SocialFacebookColorIcon />,
      },
      {
        href: 'https://instagram.com',
        ariaLabel: 'Instagram',
        icon: <SocialInstagramColorIcon />,
      },
    ],
    copyright: '© 2026 Vassembly. All rights reserved.',
  },
  header: {
    id: 'app-header',
    isSticky: true,
    menuSurfaceId: 'app-navigation-drawer',
    navLinks: [],
    logo: { href: '/', text: 'Vassembly' },
  },
  drawer: {
    sections: buildMainDrawerSections({ isAuthenticated: false }),
    branding: { productName: 'Vassembly', tagline: 'Your AI-powered workspace' },
    isAuthenticated: false,
    onLogin: noop,
    onRegister: noop,
    onLogout: noop,
  },
};
