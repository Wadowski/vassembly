import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { createElement, useState } from 'react';
import type { ComponentProps } from 'react';
import { DrawerNavigation } from './DrawerNavigation';
import { storyNavSections, storyUser } from './drawerNavigationStoryFixtures';

type DrawerNavigationProps = ComponentProps<typeof DrawerNavigation>;

const meta = {
  title: 'System Design/DrawerNavigation',
  component: DrawerNavigation,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DrawerNavigation>;

export default meta;

type DrawerStory = StoryObj<DrawerNavigationProps>;

const shellDecorator: Decorator = (StoryFn) => (
  <div style={{ height: '100vh', background: '#1a1a1e' }}>{createElement(StoryFn)}</div>
);

export const PersistentGuest: DrawerStory = {
  args: {
    layout: 'persistent',
    sections: storyNavSections,
    currentPath: '/dashboard',
    isAuthenticated: false,
    onNavigate: () => undefined,
    branding: { productName: 'Vassembly', tagline: 'Design system' },
  },
  decorators: [shellDecorator],
};

export const PersistentAuthenticated: DrawerStory = {
  args: {
    layout: 'persistent',
    sections: storyNavSections,
    currentPath: '/projects/files',
    isAuthenticated: true,
    user: storyUser,
    onNavigate: () => undefined,
    branding: { productName: 'Vassembly' },
  },
  decorators: [shellDecorator],
};

export const OverlayGuest: DrawerStory = {
  args: {
    layout: 'overlay',
    isOpen: true,
    onOpenChange: () => undefined,
    sections: storyNavSections,
    currentPath: '/',
    isAuthenticated: false,
    onNavigate: () => undefined,
    branding: { productName: 'Vassembly' },
  },
  decorators: [shellDecorator],
  render: (rawArgs: unknown): JSX.Element => {
    const args = rawArgs as Extract<DrawerNavigationProps, { layout: 'overlay' }>;
    const [isOpen, setIsOpen] = useState(args.isOpen);
    return (
      <div style={{ padding: 16 }}>
        <button type="button" onClick={() => setIsOpen(true)}>
          Open drawer
        </button>
        <DrawerNavigation
          {...args}
          layout="overlay"
          isOpen={isOpen}
          onOpenChange={({ isOpen: next }) => {
            setIsOpen(next);
          }}
        />
      </div>
    );
  },
};
