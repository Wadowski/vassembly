import { HouseIcon, LayoutDashboardIcon, ListBulletsIcon } from '@vassembly/ui-icons';
import type { DrawerUser, NavSection } from './types';

export const storyNavSections: ReadonlyArray<NavSection> = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      {
        kind: 'link',
        id: 'dash',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboardIcon,
      },
      {
        kind: 'link',
        id: 'home',
        label: 'Home',
        href: '/',
        icon: HouseIcon,
      },
    ],
  },
  {
    id: 'library',
    label: 'Library',
    items: [
      {
        kind: 'group',
        id: 'projects',
        label: 'Projects',
        defaultOpen: true,
        children: [
          {
            kind: 'link',
            id: 'proj-overview',
            label: 'Overview',
            href: '/projects/overview',
          },
          {
            kind: 'link',
            id: 'proj-files',
            label: 'Files',
            href: '/projects/files',
            match: 'prefix',
          },
        ],
      },
      {
        kind: 'link',
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: ListBulletsIcon,
      },
    ],
  },
];

export const storyUser: DrawerUser = {
  displayName: 'Jane Doe',
  email: 'jane@acme.com',
  initials: 'JD',
  roleLabel: 'Admin',
};
