import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'System Design/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/home' },
      { label: 'Components', href: '/components' },
      { label: 'Breadcrumbs', href: '/breadcrumbs' },
    ],
  },
};

export const WithCustomSeparator: Story = {
  args: {
    separator: '>',
    items: [
      { label: 'Home', href: '/home' },
      { label: 'Components', href: '/components' },
      { label: 'Breadcrumbs', href: '/breadcrumbs' },
    ],
  },
};

export const SingleItem: Story = {
  args: {
    items: [{ label: 'Home', href: '/home' }],
  },
};

export const ManyItems: Story = {
  args: {
    items: [
      { label: 'Level 1', href: '/level-1' },
      { label: 'Level 2', href: '/level-2' },
      { label: 'Level 3', href: '/level-3' },
      { label: 'Level 4', href: '/level-4' },
      { label: 'Level 5' },
    ],
  },
};
