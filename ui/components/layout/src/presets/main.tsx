import {
  HouseIcon,
  SocialFacebookColorIcon,
  SocialInstagramColorIcon,
  SocialTwitterColorIcon,
} from '@vassembly/ui-icons';
import type { LayoutPreset } from '../types';

const noop = (): void => {};

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
    sections: [
      {
        id: 'workspace',
        label: 'Workspace',
        items: [
          {
            kind: 'link' as const,
            id: 'home',
            label: 'Home',
            href: '/',
            icon: HouseIcon,
          },
        ],
      },
    ],
    branding: { productName: 'Vassembly', tagline: 'Your AI-powered workspace' },
    isAuthenticated: false,
    onLogin: noop,
    onRegister: noop,
    onLogout: noop,
  },
};
