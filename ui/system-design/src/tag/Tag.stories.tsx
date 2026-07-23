import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'System Design/Tag',
  component: Tag,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    icon: {
      control: false,
    },
    onRemove: {
      control: false,
    },
    children: {
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Tag',
    variant: 'default',
    size: 'medium',
  },
};

export const WithIcon: Story = {
  args: {
    children: 'Trending',
    variant: 'success',
    size: 'medium',
    icon: <span aria-hidden="true">#</span>,
  },
};

export const Removable: Story = {
  args: {
    children: 'Remove me',
    variant: 'warning',
    size: 'medium',
    onRemove: () => {},
    removeLabel: 'Remove tag',
  },
};

export const Sizes: Story = {
  args: {
    children: 'Size variants',
    variant: 'primary',
    size: 'medium',
  },
};

export const Variants: Story = {
  args: {
    children: 'Variant variants',
    variant: 'primary',
    size: 'medium',
  },
};

